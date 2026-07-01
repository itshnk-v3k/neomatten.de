/*
 * Übersetzungen — database-backed i18n editor with a draft/publish workflow.
 * Loads the full translation list, groups it by category into collapsible
 * sections, allows inline (debounced) editing of each locale's draft value,
 * supports a page-scoped LIFO undo, and publishes all pending drafts live via a
 * confirmed "Deploy" action.
 *
 * Perf notes (internal admin tool): no CSS transitions/animations and gap-based
 * spacing (no space-x/space-y margin selectors). Rows render at a FIXED height so
 * they can be virtualized with CDK's fixed-size strategy (see <na-virtual-list>);
 * only the on-screen slice of each expanded section is ever in the DOM.
 */
import { BreakpointObserver } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import type { OnInit, TrackByFunction } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  LucideCheck,
  LucideChevronDown,
  LucideInfo,
  LucideLanguages,
  LucidePencil,
  LucideRocket,
  LucideSearch,
  LucideUndo2,
  LucideX,
} from '@lucide/angular';
import { toast } from 'ngx-sonner';
import { map } from 'rxjs';

import { AdminI18nService } from '../../core/i18n/admin-i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { VirtualListComponent } from '../../shared/components/virtual-list/virtual-list.component';
import type { TranslationRow } from './translations.service';
import { TranslationsAdminService } from './translations.service';

/** A key with its two locale rows side by side (table row). */
interface KeyPair {
  readonly key: string;
  readonly category: string;
  de?: TranslationRow;
  en?: TranslationRow;
}

/** A category section with its key pairs and pending-change count. */
interface CategoryGroup {
  readonly category: string;
  readonly entries: KeyPair[];
  readonly pending: number;
}

/**
 * One reversible draft edit. Captures the field's state *before* the edit so
 * undo can restore it. `previousValue` is kept for the case where the previous
 * draft was null (reverted to the live value → PATCH the value so the backend
 * normalises draftValue back to null).
 */
interface UndoEntry {
  readonly translationId: string;
  readonly previousDraftValue: string | null;
  readonly previousValue: string;
  readonly timestamp: number;
}

/**
 * Fixed virtualized row heights (px), matched exactly by the row's height in the
 * template. Mobile stacks key + DE + EN vertically so it needs more room than the
 * desktop 3-column layout; the value is chosen via BreakpointObserver at runtime.
 */
const ROW_HEIGHT_DESKTOP = 76;
const ROW_HEIGHT_MOBILE = 232;
/** Tailwind `md` breakpoint — the width at which the row grid goes 3-column. */
const MD_BREAKPOINT = '(min-width: 768px)';

@Component({
  selector: 'na-translations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideLanguages,
    LucideSearch,
    LucideRocket,
    LucideChevronDown,
    LucideCheck,
    LucideUndo2,
    LucidePencil,
    LucideInfo,
    LucideX,
    TranslatePipe,
    VirtualListComponent,
  ],
  templateUrl: './translations-page.component.html',
  styles: [
    `
      :host {
        display: block;
      }
      /* Reserve the scrollbar gutter so a long field's scrollbar never clips
         under the rounded border or the focus ring. */
      textarea {
        scrollbar-gutter: stable;
      }
    `,
  ],
})
export class TranslationsPageComponent implements OnInit {
  private readonly service = inject(TranslationsAdminService);
  private readonly breakpoints = inject(BreakpointObserver);
  /** Exposed to the template for pluralized lookups (tp). */
  protected readonly i18n = inject(AdminI18nService);

  /** True at ≥768px; drives the responsive fixed row height for virtual scroll. */
  private readonly isWide = toSignal(
    this.breakpoints.observe(MD_BREAKPOINT).pipe(map(state => state.matches)),
    { initialValue: true }
  );

  /** Fixed row height passed to <na-virtual-list> as itemSize (must match CSS). */
  protected readonly itemSize = computed(() =>
    this.isWide() ? ROW_HEIGHT_DESKTOP : ROW_HEIGHT_MOBILE
  );

  /** trackBy for the virtualized rows — stable identity keeps DOM recycling correct. */
  protected readonly trackByKey: TrackByFunction<KeyPair> = (_, pair) => pair.key;

  protected readonly rows = signal<TranslationRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  /**
   * Categories the user has explicitly expanded. Sections start COLLAPSED so the
   * full dataset (~1.5k rows × 2 textareas) never mounts at once — only opened
   * sections render their rows (see the `@if` in the template). This keeps the
   * DOM small, which is the main lever for smooth viewport resizing.
   */
  protected readonly expanded = signal<ReadonlySet<string>>(new Set());
  protected readonly publishing = signal(false);
  protected readonly showConfirm = signal(false);

  /** Page-scoped LIFO undo stack (resets naturally when the route is left). */
  private readonly undoStack = signal<readonly UndoEntry[]>([]);
  protected readonly undoCount = computed(() => this.undoStack().length);

  /** Key currently being renamed (the pair's key), plus inline error + in-flight. */
  protected readonly renamingKey = signal<string | null>(null);
  protected readonly renameError = signal<string | null>(null);
  protected readonly renaming = signal(false);

  /** Rows currently being saved / just saved (drive the per-cell indicators). */
  private readonly savingIds = signal<ReadonlySet<string>>(new Set());
  private readonly savedIds = signal<ReadonlySet<string>>(new Set());

  /** Raw in-flight edit text per row id (uncommitted keystrokes, non-reactive). */
  private readonly edits = new Map<string, string>();
  /** Debounce timers per row id. */
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  /** Number of rows with a pending, unpublished draft (badge + Deploy state). */
  protected readonly pendingCount = computed(
    () => this.rows().filter(r => r.draftValue != null).length
  );

  /** Search-filtered rows grouped by category, sorted for display. */
  protected readonly groups = computed<CategoryGroup[]>(() => {
    const term = this.search().trim().toLowerCase();
    const byCategory = new Map<string, Map<string, KeyPair>>();

    for (const row of this.rows()) {
      if (term && !row.key.toLowerCase().includes(term)) {
        continue;
      }
      const category = row.category ?? 'sonstige';
      let keyMap = byCategory.get(category);
      if (!keyMap) {
        keyMap = new Map();
        byCategory.set(category, keyMap);
      }
      const pair: KeyPair = keyMap.get(row.key) ?? { key: row.key, category };
      pair[row.locale] = row;
      keyMap.set(row.key, pair);
    }

    return [...byCategory.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, keyMap]) => {
        const entries = [...keyMap.values()].sort((a, b) => a.key.localeCompare(b.key));
        const pending = entries.reduce(
          (n, p) => n + (p.de?.draftValue != null ? 1 : 0) + (p.en?.draftValue != null ? 1 : 0),
          0
        );
        return { category, entries, pending };
      });
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.rows.set(await this.service.list());
    } catch {
      toast.error(this.i18n.t('translations.loadError'));
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected isCollapsed(category: string): boolean {
    // An active search auto-expands every matching section so results are
    // visible without manual toggling; otherwise sections default to collapsed.
    if (this.search().trim() !== '') {
      return false;
    }
    return !this.expanded().has(category);
  }

  protected toggle(category: string): void {
    const next = new Set(this.expanded());
    next.has(category) ? next.delete(category) : next.add(category);
    this.expanded.set(next);
  }

  /** Current display text for a cell (uncommitted edit → draft → live value). */
  protected cellText(row: TranslationRow | undefined): string {
    if (!row) {
      return '';
    }
    return this.edits.get(row.id) ?? row.draftValue ?? row.value;
  }

  protected isSaving(row: TranslationRow | undefined): boolean {
    return row ? this.savingIds().has(row.id) : false;
  }

  protected isSaved(row: TranslationRow | undefined): boolean {
    return row ? this.savedIds().has(row.id) : false;
  }

  protected hasDraft(row: TranslationRow | undefined): boolean {
    return row?.draftValue != null;
  }

  /** On each keystroke: remember the text and debounce the save. */
  protected onCellInput(row: TranslationRow | undefined, event: Event): void {
    if (!row) {
      return;
    }
    this.edits.set(row.id, (event.target as HTMLTextAreaElement).value);
    this.scheduleSave(row.id);
  }

  /** Flush a pending debounced save immediately on blur. */
  protected onBlur(row: TranslationRow | undefined): void {
    if (!row) {
      return;
    }
    const timer = this.timers.get(row.id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(row.id);
      void this.commit(row.id);
    }
  }

  private scheduleSave(id: string): void {
    const existing = this.timers.get(id);
    if (existing) {
      clearTimeout(existing);
    }
    this.timers.set(
      id,
      setTimeout(() => void this.commit(id), 500)
    );
  }

  private async commit(id: string): Promise<void> {
    this.timers.delete(id);
    const text = this.edits.get(id);
    if (text === undefined) {
      return;
    }

    const before = this.rows().find(r => r.id === id);
    this.mutate(this.savingIds, s => s.add(id));
    try {
      const updated = await this.service.updateDraft(id, text);
      this.rows.update(rows => rows.map(r => (r.id === id ? updated : r)));
      this.edits.delete(id);

      // Record an undo step only when the draft actually changed.
      if (before && before.draftValue !== updated.draftValue) {
        this.undoStack.update(stack => [
          ...stack,
          {
            translationId: id,
            previousDraftValue: before.draftValue,
            previousValue: before.value,
            timestamp: Date.now(),
          },
        ]);
      }
      this.flashSaved(id);
    } catch {
      toast.error(this.i18n.t('translations.saveError'));
    } finally {
      this.mutate(this.savingIds, s => s.delete(id));
    }
  }

  /** Undo the single most recent edit (LIFO), restoring that one field. */
  protected async undo(): Promise<void> {
    const stack = this.undoStack();
    const entry = stack[stack.length - 1];
    if (!entry) {
      return;
    }
    const { translationId: id, previousDraftValue, previousValue } = entry;

    // Drop any in-flight edit on this field so it can't clobber the restore.
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.edits.delete(id);

    // If the previous draft was null, PATCH the live value → backend normalises
    // draftValue back to null (removing the pending change from the field).
    const restore = previousDraftValue ?? previousValue;
    this.mutate(this.savingIds, s => s.add(id));
    try {
      const updated = await this.service.updateDraft(id, restore);
      this.rows.update(rows => rows.map(r => (r.id === id ? updated : r)));
      this.undoStack.update(s => s.slice(0, -1));
      this.flashSaved(id);
    } catch {
      toast.error(this.i18n.t('translations.undoError'));
    } finally {
      this.mutate(this.savingIds, s => s.delete(id));
    }
  }

  // ── Key renaming (structural, immediate — not part of draft/publish) ──────

  protected isRenaming(pair: KeyPair): boolean {
    return this.renamingKey() === pair.key;
  }

  protected startRename(pair: KeyPair): void {
    this.renameError.set(null);
    this.renamingKey.set(pair.key);
  }

  protected cancelRename(): void {
    this.renamingKey.set(null);
    this.renameError.set(null);
  }

  /**
   * Confirm an inline key rename. Validates client-side, asks for confirmation
   * (structural change), then calls the endpoint. On 409 shows an inline error.
   */
  protected async confirmRename(pair: KeyPair, rawKey: string): Promise<void> {
    const newKey = rawKey.trim();
    if (newKey === '' || newKey === pair.key) {
      this.cancelRename();
      return;
    }
    if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(newKey)) {
      this.renameError.set(this.i18n.t('translations.renameValidation'));
      return;
    }
    const id = pair.de?.id ?? pair.en?.id;
    if (!id) {
      return;
    }
    const confirmed = confirm(
      this.i18n.t('translations.renameConfirmPrompt', { key: pair.key, newKey })
    );
    if (!confirmed) {
      return;
    }

    this.renaming.set(true);
    this.renameError.set(null);
    try {
      const updated = await this.service.renameKey(id, newKey);
      // Swap the two renamed rows into place by id.
      this.rows.update(rows => rows.map(r => updated.find(u => u.id === r.id) ?? r));
      this.renamingKey.set(null);
      toast.success(this.i18n.t('translations.renameSuccess'));
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        this.renameError.set(this.i18n.t('translations.renameConflict', { key: newKey }));
      } else {
        toast.error(this.i18n.t('translations.renameError'));
      }
    } finally {
      this.renaming.set(false);
    }
  }

  protected async publish(): Promise<void> {
    this.publishing.set(true);
    try {
      const { published } = await this.service.publish();
      await this.reload();
      // Published drafts are now live; page-scoped undo history no longer applies.
      this.undoStack.set([]);
      toast.success(this.i18n.tp('translations.publishSuccess', published));
    } catch {
      toast.error(this.i18n.t('translations.publishError'));
    } finally {
      this.publishing.set(false);
      this.showConfirm.set(false);
    }
  }

  private flashSaved(id: string): void {
    this.mutate(this.savedIds, s => s.add(id));
    setTimeout(() => this.mutate(this.savedIds, s => s.delete(id)), 1500);
  }

  /** Immutable update of a Set signal (keeps OnPush change detection honest). */
  private mutate(sig: typeof this.savingIds, apply: (s: Set<string>) => void): void {
    const next = new Set(sig());
    apply(next);
    sig.set(next);
  }
}
