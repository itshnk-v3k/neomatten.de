/*
 * Übersetzungen — database-backed i18n editor with a draft/publish workflow.
 * Loads the full translation list, groups it by category into collapsible
 * sections, allows inline (debounced) editing of each locale's draft value, and
 * publishes all pending drafts live via a confirmed "Deploy" action.
 */
import type {
  OnInit} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  LucideCheck,
  LucideChevronDown,
  LucideLanguages,
  LucideRocket,
  LucideSearch,
} from '@lucide/angular';
import { toast } from 'ngx-sonner';

import type { TranslationRow} from './translations.service';
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

@Component({
  selector: 'na-translations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideLanguages, LucideSearch, LucideRocket, LucideChevronDown, LucideCheck],
  templateUrl: './translations-page.component.html',
})
export class TranslationsPageComponent implements OnInit {
  private readonly service = inject(TranslationsAdminService);

  protected readonly rows = signal<TranslationRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());
  protected readonly publishing = signal(false);
  protected readonly showConfirm = signal(false);

  /** Rows currently being saved / just saved (drive the per-cell indicators). */
  private readonly savingIds = signal<ReadonlySet<string>>(new Set());
  private readonly savedIds = signal<ReadonlySet<string>>(new Set());

  /** Raw in-flight edit text per row id (uncommitted keystrokes). */
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

  /** Rough initial line count so long copy is not clipped to one row. */
  protected rowsFor(text: string): number {
    const byLength = Math.ceil(text.length / 48);
    const byLines = text.split('\n').length;
    return Math.min(10, Math.max(1, byLength, byLines));
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

  /** On each keystroke: auto-grow, remember the text, and debounce a save. */
  protected onInput(row: TranslationRow | undefined, event: Event): void {
    if (!row) {
      return;
    }
    const el = event.target as HTMLTextAreaElement;
    this.autoGrow(el);
    this.edits.set(row.id, el.value);

    const existing = this.timers.get(row.id);
    if (existing) {
      clearTimeout(existing);
    }
    this.timers.set(
      row.id,
      setTimeout(() => void this.commit(row.id), 500)
    );
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

  private async commit(id: string): Promise<void> {
    this.timers.delete(id);
    const text = this.edits.get(id);
    if (text === undefined) {
      return;
    }

    this.mutate(this.savingIds, s => s.add(id));
    try {
      const updated = await this.service.updateDraft(id, text);
      this.rows.update(rows => rows.map(r => (r.id === id ? updated : r)));
      this.edits.delete(id);
      this.mutate(this.savedIds, s => s.add(id));
      setTimeout(() => this.mutate(this.savedIds, s => s.delete(id)), 1500);
    } catch {
      toast.error('Speichern fehlgeschlagen.');
    } finally {
      this.mutate(this.savingIds, s => s.delete(id));
    }
  }

  protected async publish(): Promise<void> {
    this.publishing.set(true);
    try {
      const { published } = await this.service.publish();
      await this.reload();
      toast.success(`${published} Änderung${published === 1 ? '' : 'en'} veröffentlicht.`);
    } catch {
      toast.error('Veröffentlichen fehlgeschlagen.');
    } finally {
      this.publishing.set(false);
      this.showConfirm.set(false);
    }
  }

  private autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  /** Immutable update of a Set signal (keeps OnPush change detection honest). */
  private mutate(sig: typeof this.savingIds, apply: (s: Set<string>) => void): void {
    const next = new Set(sig());
    apply(next);
    sig.set(next);
  }
}
