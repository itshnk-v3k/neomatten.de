/*
 * EN: Root application component. Hosts the global router outlet that renders
 *     the active route (wrapped by the Shell layout) and reports each completed
 *     navigation to GA4 (AnalyticsService gates page views on cookie consent).
 * RU: Корневой компонент приложения. Содержит глобальный router-outlet, который
 *     отображает активный маршрут (обёрнутый макетом Shell), и сообщает каждую
 *     завершённую навигацию в GA4 (AnalyticsService учитывает согласие на cookie).
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics.service';
import { filter } from 'rxjs';

@Component({
  selector: 'nm-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  constructor() {
    // Report each completed navigation as a GA4 page_view (no-op until consent).
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(event => this.analytics.trackPageView(event.urlAfterRedirects));
  }
}
