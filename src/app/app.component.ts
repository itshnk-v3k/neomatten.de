/*
 * EN: Root application component. Hosts the global router outlet that renders
 *     the active route (wrapped by the Shell layout).
 * RU: Корневой компонент приложения. Содержит глобальный router-outlet,
 *     который отображает активный маршрут (обёрнутый макетом Shell).
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'nm-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
