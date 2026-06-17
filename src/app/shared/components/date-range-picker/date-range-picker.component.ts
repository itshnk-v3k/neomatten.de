/*
 * EN: Custom inline date-range picker — no native date input. Two month grids on
 *     desktop (one on mobile), click start then end to set an inclusive range,
 *     highlighted in primary. Opens as an anchored popover on desktop and a
 *     bottom sheet on mobile (driven by the `isDesktop` input). Emits a
 *     {start, end} range (start at 00:00, end at 23:59:59) via the `value` model.
 * RU: Кастомный выбор диапазона дат — без нативного input. Две сетки месяцев на
 *     десктопе (одна на мобиле); клик по началу, затем по концу задаёт включающий
 *     диапазон, подсвеченный основным цветом. Открывается поповером на десктопе и
 *     нижним листом на мобиле (вход `isDesktop`). Возвращает диапазон {start, end}
 *     (начало 00:00, конец 23:59:59) через модель `value`.
 */
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { TranslationService } from '@core/i18n/translation.service';
import { LucideCalendar, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { SheetComponent } from '@shared/components/sheet/sheet.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/** Inclusive day range; `start` is at 00:00:00, `end` at 23:59:59 of its day. */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

@Component({
  selector: 'nm-date-range-picker',
  imports: [
    NgTemplateOutlet,
    TranslatePipe,
    SheetComponent,
    ButtonDirective,
    LucideCalendar,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-range-picker.component.html',
})
export class DateRangePickerComponent {
  private readonly translation = inject(TranslationService);

  /** Two-way selected range (null when no range is active). */
  readonly value = model<DateRange | null>(null);
  /** lg+ gate: popover when true, bottom sheet when false. */
  readonly isDesktop = input<boolean>(true);

  /** Popover / sheet open state. */
  protected readonly open = signal(false);
  /** First-of-month shown in the left calendar. */
  protected readonly viewMonth = signal<Date>(this.startOfMonth(new Date()));
  /** In-progress selection (not committed until Apply). */
  protected readonly draftStart = signal<Date | null>(null);
  protected readonly draftEnd = signal<Date | null>(null);
  /** Hovered day, for the live range preview before the end is clicked. */
  protected readonly hover = signal<Date | null>(null);

  /** Localized Mon–Sun short weekday headers (re-resolves on language change). */
  protected readonly weekdays = computed<string[]>(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    // 2024-01-01 is a Monday — generate Mon…Sun.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  });

  protected readonly leftLabel = computed(() => this.monthLabel(this.viewMonth()));
  protected readonly rightLabel = computed(() =>
    this.monthLabel(this.addMonths(this.viewMonth(), 1))
  );
  protected readonly leftCells = computed(() => this.cells(this.viewMonth()));
  protected readonly rightCells = computed(() => this.cells(this.addMonths(this.viewMonth(), 1)));

  /** Trigger label, e.g. "01.06 – 17.06.2026" (empty when no range). */
  protected readonly label = computed(() => {
    const v = this.value();
    if (!v) return '';
    const p = (n: number): string => String(n).padStart(2, '0');
    const s = v.start;
    const e = v.end;
    return `${p(s.getDate())}.${p(s.getMonth() + 1)} – ${p(e.getDate())}.${p(e.getMonth() + 1)}.${e.getFullYear()}`;
  });

  /** Open the picker, seeding the draft + view from the committed value. */
  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    const v = this.value();
    this.draftStart.set(v?.start ?? null);
    this.draftEnd.set(v?.end ?? null);
    this.viewMonth.set(this.startOfMonth(v?.start ?? new Date()));
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    this.hover.set(null);
  }

  protected prevMonth(): void {
    this.viewMonth.set(this.addMonths(this.viewMonth(), -1));
  }
  protected nextMonth(): void {
    this.viewMonth.set(this.addMonths(this.viewMonth(), 1));
  }

  /** First click sets the start (clears end); second sets the end (or restarts if earlier). */
  protected select(day: Date): void {
    const start = this.draftStart();
    const end = this.draftEnd();
    if (!start || (start && end)) {
      this.draftStart.set(day);
      this.draftEnd.set(null);
      return;
    }
    if (day < start) {
      this.draftStart.set(day);
      return;
    }
    this.draftEnd.set(day);
  }

  /** Commit the draft to `value` (single day if only a start was picked). */
  protected apply(): void {
    const start = this.draftStart();
    if (!start) {
      this.value.set(null);
      this.close();
      return;
    }
    const end = this.draftEnd() ?? start;
    this.value.set({ start: this.startOfDay(start), end: this.endOfDay(end) });
    this.close();
  }

  /** Clear the selection and the active filter. */
  protected clear(): void {
    this.draftStart.set(null);
    this.draftEnd.set(null);
    this.value.set(null);
    this.close();
  }

  /** Tailwind classes for a day cell given its selection/range state. */
  protected dayClasses(day: Date): string {
    const base = 'grid size-11 place-items-center rounded-md text-sm transition-colors md:size-10';
    if (this.isStart(day) || this.isEnd(day)) {
      return `${base} bg-primary font-semibold text-white`;
    }
    if (this.inRange(day)) {
      return `${base} bg-primary/10 text-primary`;
    }
    return `${base} text-content hover:bg-surface-subtle`;
  }

  protected isStart(day: Date): boolean {
    const s = this.draftStart();
    return !!s && this.sameDay(day, s);
  }
  protected isEnd(day: Date): boolean {
    const e = this.draftEnd();
    return !!e && this.sameDay(day, e);
  }
  protected inRange(day: Date): boolean {
    const start = this.draftStart();
    if (!start) return false;
    const endpoint = this.draftEnd() ?? this.hover();
    if (!endpoint) return false;
    const lo = start < endpoint ? start : endpoint;
    const hi = start < endpoint ? endpoint : start;
    return day > lo && day < hi;
  }

  // --- date helpers ---------------------------------------------------------
  private locale(): string {
    return this.translation.currentLanguage() === 'de' ? 'de-DE' : 'en-US';
  }
  private monthLabel(d: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(d);
  }
  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  private addMonths(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + n, 1);
  }
  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  private endOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  /** Month cells as a Mon-first grid: leading blanks (null) then each day. */
  private cells(month: Date): (Date | null)[] {
    const year = month.getFullYear();
    const m = month.getMonth();
    const lead = (new Date(year, m, 1).getDay() + 6) % 7; // Mon=0 … Sun=6
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, m, d));
    return out;
  }
}
