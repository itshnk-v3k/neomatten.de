/*
 * Admin sidebar — brand wordmark + primary navigation with lucide icons and an
 * active-route highlight. Always visible on desktop; on mobile it slides in as a
 * drawer (controlled by the `open` input) and emits `navigate` so the shell can
 * close the drawer after a selection.
 */
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideLanguages,
  LucideLayoutDashboard,
  LucidePackage,
  LucideSettings,
  LucideShoppingBag,
  LucideUsers,
} from '@lucide/angular';

@Component({
  selector: 'na-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideShoppingBag,
    LucidePackage,
    LucideUsers,
    LucideLanguages,
    LucideSettings,
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  /** Whether the mobile drawer is open (ignored on desktop). */
  readonly open = input(false);
  /** Emitted when a nav link is activated, so the shell can close the drawer. */
  readonly navigate = output<void>();
}
