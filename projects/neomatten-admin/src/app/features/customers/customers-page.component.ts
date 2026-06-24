/* Customers placeholder — real customer management arrives in a later phase. */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'na-customers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
      <h2 class="text-xl font-semibold text-neutral-900">Kunden</h2>
      <p class="mt-2 text-sm text-neutral-500">
        Kundenverwaltung folgt in einer späteren Phase.
      </p>
    </section>
  `,
})
export class CustomersPageComponent {}
