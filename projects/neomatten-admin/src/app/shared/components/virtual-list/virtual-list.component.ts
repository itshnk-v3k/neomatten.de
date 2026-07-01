/*
 * na-virtual-list — a thin, reusable CDK virtual-scroll wrapper for large
 * in-page lists (translations editor today; orders/customers later).
 *
 * Design (see ADMIN.md → "Large lists / virtual scrolling"):
 * - FIXED item size (FixedSizeVirtualScrollStrategy). CDK's autosize strategy
 *   lives in @angular/cdk-experimental (an extra dependency) and is slower, so
 *   callers give a fixed `itemSize` and render rows clamped to that height.
 * - The viewport height fits its content up to `maxHeight`, so short lists show
 *   every row with NO inner scrollbar and only long lists get their own bounded
 *   scroll region — avoiding a needless nested scroll for small sections.
 * - Rows are provided as an <ng-template> so the caller keeps full control of
 *   row markup/bindings (the template resolves in the CALLER's context).
 */
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type TemplateRef,
  type TrackByFunction,
} from '@angular/core';

@Component({
  selector: 'na-virtual-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule, NgTemplateOutlet],
  template: `
    <cdk-virtual-scroll-viewport
      [itemSize]="itemSize()"
      [style.height.px]="viewportHeight()"
      class="w-full">
      <div *cdkVirtualFor="let item of items(); trackBy: trackBy()" [style.height.px]="itemSize()">
        <ng-container *ngTemplateOutlet="rowTemplate(); context: { $implicit: item }" />
      </div>
    </cdk-virtual-scroll-viewport>
  `,
})
export class VirtualListComponent<T> {
  /** The full (already filtered/sorted) data set — CDK renders only the slice in view. */
  readonly items = input.required<readonly T[]>();
  /** Fixed row height in px; rows MUST render at exactly this height. */
  readonly itemSize = input.required<number>();
  /** Cap on the viewport height (px). Lists taller than this scroll internally. */
  readonly maxHeight = input(600);
  /** Row markup, declared as <ng-template let-item> by the caller. */
  readonly rowTemplate = input.required<TemplateRef<{ $implicit: T }>>();
  /** trackBy for stable DOM recycling; defaults to index. */
  readonly trackBy = input<TrackByFunction<T>>((index: number) => index);

  /** Fit content up to the cap → no inner scroll for short lists. */
  protected readonly viewportHeight = computed(() =>
    Math.min(this.items().length * this.itemSize(), this.maxHeight())
  );
}
