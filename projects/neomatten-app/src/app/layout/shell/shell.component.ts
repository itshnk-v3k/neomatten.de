/*
 * EN: Application shell. Wraps every routed page with the shared chrome —
 *     announce bar, header, footer — and the global toast outlet, and hosts the
 *     page router outlet.
 * RU: Оболочка приложения. Оборачивает каждую страницу общими элементами —
 *     announce bar, хедер, футер — и глобальным выводом тостов, и содержит
 *     router-outlet страниц.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieConsentComponent } from '@shared/components/cookie-consent/cookie-consent.component';
import { DiscountPopupComponent } from '@shared/components/discount-popup/discount-popup.component';
import { OrderConfirmedDialogComponent } from '@shared/components/order-confirmed-dialog/order-confirmed-dialog.component';
import { RouteLoadingComponent } from '@shared/components/route-loading/route-loading.component';
import { ToasterComponent } from '@shared/components/toaster/toaster.component';

import { AnnounceBarComponent } from '../announce-bar/announce-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'nm-shell',
  imports: [
    RouterOutlet,
    ToasterComponent,
    AnnounceBarComponent,
    HeaderComponent,
    FooterComponent,
    DiscountPopupComponent,
    OrderConfirmedDialogComponent,
    RouteLoadingComponent,
    CookieConsentComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {}
