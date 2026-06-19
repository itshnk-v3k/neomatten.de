/*
 * EN: Admin TODO marker — a highlighted yellow inline badge for legal/content
 *     fields that still need the client's real data (company name, address, tax
 *     IDs, court of jurisdiction, …). Always pair one with an
 *     `<!-- TODO(admin): … -->` comment in the template so developers can grep
 *     for the open items; the badge keeps them visible in the rendered page so
 *     nothing ships silently empty.
 * RU: Маркер TODO для админа — жёлтый встроенный бейдж для юридических/контентных
 *     полей, где ещё нужны реальные данные клиента (название, адрес, налоговые
 *     номера, подсудность …). Рядом всегда ставим комментарий
 *     `<!-- TODO(admin): … -->` для поиска; бейдж делает поле заметным в верстке.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'nm-todo-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mark
      class="mx-0.5 inline-block rounded border border-warning/60 bg-warning/20 px-1.5 py-0.5 align-baseline text-sm leading-snug text-content">
      <span class="font-bold text-warning">⚠ TODO(admin):</span>
      <ng-content />
    </mark>
  `,
})
export class TodoAdminComponent {}
