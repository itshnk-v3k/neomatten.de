/* Dashboard placeholder — real widgets arrive in a later phase. */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'na-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
      <h2 class="text-xl font-semibold text-neutral-900">Dashboard</h2>
      <p class="mt-2 text-sm text-neutral-500">
        Übersicht und Kennzahlen folgen in einer späteren Phase.
      </p>
    </section>
  `,
})
export class DashboardPageComponent {}
