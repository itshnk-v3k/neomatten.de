/*
 * Übersetzungen — database-backed i18n editor with a draft/publish workflow.
 * Loads the full translation list, groups it by category into collapsible
 * sections, allows inline (debounced) editing of each locale's draft value,
 * supports a page-scoped LIFO undo, and publishes all pending drafts live via a
 * confirmed "Deploy" action.
 *
 * Perf notes (internal admin tool): no CSS transitions/animations, gap-based
 * spacing (no space-x/space-y margin selectors), and paired textarea heights are
 * synced imperatively so DE/EN cells stay aligned without layout thrash.
 */
import { HttpErrorResponse } from '@angular/common/http';
import type { AfterViewInit, ElementRef, OnInit, QueryList } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

/** Textarea max render height (px) before an inner scrollbar appears. */
const MAX_FIELD_HEIGHT = 200;

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
export class TranslationsPageComponent implements OnInit, AfterViewInit {
  private readonly service = inject(TranslationsAdminService);
  private readonly destroyRef = inject(DestroyRef);

  /** Row wrappers, used to re-sync paired textarea heights after re-renders. */
  @ViewChildren('rowEl') private rowEls!: QueryList<ElementRef<HTMLElement>>;

  protected readonly rows = signal<TranslationRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());
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

  ngAfterViewInit(): void {
    // Re-sync paired heights whenever the rendered row set changes (data load,
    // search filter, collapse/expand).
    this.rowEls.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.scheduleSyncAll());
    this.scheduleSyncAll();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.rows.set(await this.service.list());
    } catch {
      toast.error('Übersetzungen konnten nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected isCollapsed(category: string): boolean {
    return this.collapsed().has(category);
  }

  protected toggle(category: string): void {
    const next = new Set(this.collapsed());
    next.has(category) ? next.delete(category) : next.add(category);
    this.collapsed.set(next);
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

  /** On each keystroke: remember the text, sync the pair height, debounce save. */
  protected onCellInput(
    row: TranslationRow | undefined,
    event: Event,
    deEl: HTMLTextAreaElement,
    enEl: HTMLTextAreaElement
  ): void {
    if (!row) {
      return;
    }
    this.edits.set(row.id, (event.target as HTMLTextAreaElement).value);
    this.syncHeights(deEl, enEl);
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
      this.scheduleSyncAll();
    } catch {
      toast.error('Speichern fehlgeschlagen.');
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
      this.scheduleSyncAll();
    } catch {
      toast.error('Rückgängig fehlgeschlagen.');
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
      this.renameError.set('Nur Kleinbuchstaben, Ziffern und einzelne Unterstriche.');
      return;
    }
    const id = pair.de?.id ?? pair.en?.id;
    if (!id) {
      return;
    }
    const confirmed = confirm(
      `Schlüssel "${pair.key}" in "${newKey}" umbenennen? Der alte Schlüssel bleibt vorübergehend aktiv.`
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
      toast.success(
        'Schlüssel umbenannt. Der alte Schlüssel bleibt vorübergehend aktiv, bis der Code aktualisiert wurde.'
      );
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        this.renameError.set(`Schlüssel "${newKey}" existiert bereits.`);
      } else {
        toast.error('Umbenennen fehlgeschlagen.');
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
      toast.success(`${published} Änderung${published === 1 ? '' : 'en'} veröffentlicht.`);
    } catch {
      toast.error('Veröffentlichen fehlgeschlagen.');
    } finally {
      this.publishing.set(false);
      this.showConfirm.set(false);
    }
  }

  private flashSaved(id: string): void {
    this.mutate(this.savedIds, s => s.add(id));
    setTimeout(() => this.mutate(this.savedIds, s => s.delete(id)), 1500);
  }

  /** Sync a DE/EN pair to the taller content height (capped by CSS max-height). */
  private syncHeights(...els: (HTMLTextAreaElement | undefined)[]): void {
    const present = els.filter((el): el is HTMLTextAreaElement => !!el);
    if (present.length === 0) {
      return;
    }
    for (const el of present) {
      el.style.height = 'auto';
    }
    const tallest = Math.min(MAX_FIELD_HEIGHT, Math.max(...present.map(el => el.scrollHeight)));
    for (const el of present) {
      el.style.height = `${tallest}px`;
    }
  }

  /** Re-sync every currently rendered row's textarea pair on the next frame. */
  private scheduleSyncAll(): void {
    requestAnimationFrame(() => {
      for (const ref of this.rowEls) {
        const areas = ref.nativeElement.querySelectorAll('textarea');
        this.syncHeights(areas[0] as HTMLTextAreaElement, areas[1] as HTMLTextAreaElement);
      }
    });
  }

  /** Immutable update of a Set signal (keeps OnPush change detection honest). */
  private mutate(sig: typeof this.savingIds, apply: (s: Set<string>) => void): void {
    const next = new Set(sig());
    apply(next);
    sig.set(next);
  }
}
