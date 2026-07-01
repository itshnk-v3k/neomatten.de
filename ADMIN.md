# NEOMATTEN Admin — conventions

Notes for working on the `neomatten-admin` app (`projects/neomatten-admin`).

## Routing / lazy loading

The admin app is fully standalone (no NgModules). Every feature route uses
`loadComponent` for route-level code splitting — each feature page ships as its
own lazy chunk and is only downloaded when navigated to. There is no
`loadChildren` because that is for lazy NgModules, which this project does not
use. When adding a page, follow the existing pattern in
[`app.routes.ts`](projects/neomatten-admin/src/app/app.routes.ts):

```ts
{
  path: 'invoices',
  loadComponent: () =>
    import('./features/invoices/invoices-page.component').then(m => m.InvoicesPageComponent),
}
```

`ShellComponent` (the layout wrapper) and route guards are imported eagerly on
purpose — they are needed for the very first authenticated paint.

Heavy, single-route-only dependencies (charting, rich-text editors, etc.) should
be imported **inside the lazily-loaded feature component** so they land in that
feature's chunk, never in the initial bundle.

## Large lists / virtual scrolling

**Rule of thumb: when a list can exceed ~100 rows, virtualize it.** Collapsing
sections by default helps, but a single large expanded list still mounts every
row without virtualization.

Use the shared
[`na-virtual-list`](projects/neomatten-admin/src/app/shared/components/virtual-list/virtual-list.component.ts)
wrapper (built on `@angular/cdk/scrolling`, already a dependency — no new
package). The **translations editor is the reference implementation**
([`translations-page.component`](projects/neomatten-admin/src/app/features/translations)).

### Pattern

1. Declare the row markup once as an `<ng-template let-item>`. It resolves in the
   host component's context, so all your bindings/handlers keep working — even
   though CDK **recycles** the DOM nodes as you scroll.
2. Render it through the wrapper:

   ```html
   <ng-template #rowTpl let-order>
     <div [style.height.px]="itemSize()" class="overflow-hidden …">…</div>
   </ng-template>

   <na-virtual-list
     [items]="orders()"
     [itemSize]="itemSize()"
     [rowTemplate]="rowTpl"
     [trackBy]="trackById" />
   ```

3. **Fixed item size, not autosize.** CDK's autosize strategy is in
   `@angular/cdk-experimental` (extra dep) and is slower, so we use the built-in
   fixed-size strategy. That means **rows must render at exactly `itemSize` px** —
   set the row height to `itemSize()` and let overflowing content scroll inside a
   cell (e.g. a `textarea` with `overflow-y-auto`) rather than growing the row.
   Do **not** re-introduce JS height-syncing — variable row heights break the
   fixed-size strategy and cause the layout thrash we removed.
4. **Responsive height:** if the row is taller on mobile (stacked) than desktop,
   compute `itemSize` from `BreakpointObserver` (`@angular/cdk/layout`) — it is
   event-driven (matchMedia), not a `window.resize` listener, so it does not
   reintroduce resize jank. See `itemSize` in the translations page.
5. **Filtering** must update the array bound to `[items]` (the data source), not
   just hide DOM nodes — the viewport renders whatever `items` contains.
6. The wrapper fits its height to the content up to `maxHeight` (default 600px),
   so short lists have no inner scrollbar and only long lists get their own
   bounded scroll region inside the shell's scrollable `<main>`.
