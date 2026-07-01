/* Orders placeholder — real order management arrives in a later phase. */
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'na-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <section class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
      <h2 class="text-xl font-semibold text-neutral-900">{{ 'pages.orders.title' | t }}</h2>
      <p class="mt-2 text-sm text-neutral-500">{{ 'pages.orders.description' | t }}</p>
    </section>
  `,
})
export class OrdersPageComponent {}
