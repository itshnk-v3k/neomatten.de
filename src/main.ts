/*
 * EN: Application entry point. Bootstraps the standalone root component with
 *     the application-wide providers defined in app.config.ts.
 * RU: Точка входа приложения. Загружает standalone корневой компонент с
 *     общими провайдерами, определёнными в app.config.ts.
 */
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
