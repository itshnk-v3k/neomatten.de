/*
 * EN: Application route table. English URL slugs (better for SEO + a consistent
 *     codebase); UI copy still switches DE/EN via the translation service. Old
 *     German slugs redirect to the English ones so existing links don't 404.
 *     Every page is a lazy-loaded standalone component wrapped by the Shell.
 * RU: Таблица маршрутов приложения. Английские слаги в URL (лучше для SEO и
 *     единообразия кода); текст интерфейса переключается DE/EN через сервис
 *     переводов. Старые немецкие слаги редиректят на английские, чтобы ссылки
 *     не давали 404. Каждая страница — ленивый standalone-компонент в Shell.
 */
import type { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('@features/home/home-page/home-page.component').then(m => m.HomePageComponent),
        // Title + meta are set by SeoService from this `seo` data (localized via i18n keys).
        data: { seo: { titleKey: 'seo_home_title', descriptionKey: 'seo_home_description' } },
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('@features/catalog/catalog-page.component').then(m => m.CatalogPageComponent),
        data: {
          seo: { titleKey: 'seo_catalog_title', descriptionKey: 'seo_catalog_description' },
          schema: {
            type: 'product',
            product: {
              name: 'EVA Auto Fußmatten nach Maß',
              description:
                'Maßgefertigte EVA-Automatten für über 1800 Fahrzeugmodelle — wasserdicht, rutschfest und langlebig.',
              price: '89',
              image: 'https://neomatten.de/assets/content/carpet.jpg',
            },
          },
        },
      },
      {
        // Configurator step 1 — brand selection grid.
        path: 'configurator',
        loadComponent: () =>
          import('@features/configurator/brand-select-page/brand-select-page.component').then(
            m => m.BrandSelectPageComponent
          ),
        data: {
          seo: {
            titleKey: 'seo_configurator_title',
            descriptionKey: 'seo_configurator_description',
          },
          schema: {
            type: 'product',
            product: {
              name: 'EVA Auto Fußmatten — Konfigurator',
              description:
                'Konfigurieren Sie Ihre EVA-Automatten: Fahrzeug wählen, Farbe und Rand anpassen, sofort bestellen.',
              price: '89',
              image: 'https://neomatten.de/assets/content/carpet.jpg',
            },
          },
        },
      },
      {
        // Configurator step 2 — vehicle + configuration (brand pre-filled from :brand).
        path: 'configurator/:brand',
        loadComponent: () =>
          import('@features/configurator/configurator-page/configurator-page.component').then(
            m => m.ConfiguratorPageComponent
          ),
        data: {
          seo: {
            titleKey: 'seo_configurator_title',
            descriptionKey: 'seo_configurator_description',
          },
        },
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('@features/cart/cart-page.component').then(m => m.CartPageComponent),
        data: { seo: { titleKey: 'seo_cart_title', descriptionKey: 'seo_cart_description' } },
      },
      {
        path: 'account',
        children: [
          // Public auth pages (no account shell) — listed before the empty-path
          // shell so 'account/login' etc. match these instead of a shell child.
          {
            path: 'login',
            canActivate: [guestGuard],
            loadComponent: () =>
              import('@features/account/login-page/login-page.component').then(
                m => m.LoginPageComponent
              ),
            data: { seo: { titleKey: 'seo_login_title', descriptionKey: 'seo_login_description' } },
          },
          {
            path: 'register',
            canActivate: [guestGuard],
            loadComponent: () =>
              import('@features/account/register-page/register-page.component').then(
                m => m.RegisterPageComponent
              ),
            data: {
              seo: { titleKey: 'seo_register_title', descriptionKey: 'seo_register_description' },
            },
          },
          {
            path: 'forgot-password',
            loadComponent: () =>
              import('@features/account/forgot-password-page/forgot-password-page.component').then(
                m => m.ForgotPasswordPageComponent
              ),
            data: {
              seo: { titleKey: 'seo_forgot_title', descriptionKey: 'seo_forgot_description' },
            },
          },
          // Authenticated account area, wrapped by the sidebar/tabs shell.
          {
            path: '',
            loadComponent: () =>
              import('@features/account/account-shell/account-shell.component').then(
                m => m.AccountShellComponent
              ),
            children: [
              {
                path: '',
                canActivate: [authGuard],
                loadComponent: () =>
                  import('@features/account/account-page/account-page.component').then(
                    m => m.AccountPageComponent
                  ),
                data: {
                  seo: { titleKey: 'seo_account_title', descriptionKey: 'seo_account_description' },
                },
              },
              {
                path: 'profile',
                canActivate: [authGuard],
                loadComponent: () =>
                  import('@features/account/profile-page/profile-page.component').then(
                    m => m.ProfilePageComponent
                  ),
                data: {
                  seo: { titleKey: 'seo_account_title', descriptionKey: 'seo_account_description' },
                },
              },
              {
                path: 'password',
                canActivate: [authGuard],
                loadComponent: () =>
                  import('@features/account/password-page/password-page.component').then(
                    m => m.PasswordPageComponent
                  ),
                data: {
                  seo: { titleKey: 'seo_account_title', descriptionKey: 'seo_account_description' },
                },
              },
            ],
          },
        ],
      },
      {
        path: 'products',
        loadComponent: () =>
          import('@features/products/products-page.component').then(m => m.ProductsPageComponent),
        data: {
          seo: { titleKey: 'seo_products_title', descriptionKey: 'seo_products_description' },
        },
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('@features/contact/contact-page.component').then(m => m.ContactPageComponent),
        data: { seo: { titleKey: 'seo_contact_title', descriptionKey: 'seo_contact_description' } },
      },
      {
        path: 'faq',
        loadComponent: () =>
          import('@features/faq/faq-page.component').then(m => m.FaqPageComponent),
        data: { seo: { titleKey: 'seo_faq_title', descriptionKey: 'seo_faq_description' } },
      },
      {
        path: 'cushions',
        loadComponent: () =>
          import('@features/cushions/cushions-page.component').then(m => m.CushionsPageComponent),
        data: {
          seo: { titleKey: 'seo_cushions_title', descriptionKey: 'seo_cushions_description' },
        },
      },
      {
        path: 'cushions/:id',
        loadComponent: () =>
          import('@features/product-detail/product-detail-page.component').then(
            m => m.ProductDetailPageComponent
          ),
        data: {
          seo: { titleKey: 'seo_cushions_title', descriptionKey: 'seo_cushions_description' },
        },
      },
      {
        path: 'eva-bags',
        loadComponent: () =>
          import('@features/eva-bags/eva-bags-page/eva-bags-page.component').then(
            m => m.EvaBagsPageComponent
          ),
        data: {
          seo: { titleKey: 'seo_eva_bags_title', descriptionKey: 'seo_eva_bags_description' },
        },
      },
      {
        // Static subcategory listings — must precede the `:id` detail route.
        path: 'eva-bags/with-lid',
        loadComponent: () =>
          import('@features/eva-bags/eva-bags-list-page/eva-bags-list-page.component').then(
            m => m.EvaBagsListPageComponent
          ),
        data: {
          subcategory: 'with-lid',
          titleKey: 'eva_bags_with_lid_title',
          seo: { titleKey: 'seo_eva_bags_title', descriptionKey: 'seo_eva_bags_description' },
        },
      },
      {
        path: 'eva-bags/without-lid',
        loadComponent: () =>
          import('@features/eva-bags/eva-bags-list-page/eva-bags-list-page.component').then(
            m => m.EvaBagsListPageComponent
          ),
        data: {
          subcategory: 'without-lid',
          titleKey: 'eva_bags_without_lid_title',
          seo: { titleKey: 'seo_eva_bags_title', descriptionKey: 'seo_eva_bags_description' },
        },
      },
      {
        path: 'eva-bags/:id',
        loadComponent: () =>
          import('@features/product-detail/product-detail-page.component').then(
            m => m.ProductDetailPageComponent
          ),
        data: {
          seo: { titleKey: 'seo_eva_bags_title', descriptionKey: 'seo_eva_bags_description' },
        },
      },
      {
        path: 'leather-bags',
        loadComponent: () =>
          import('@features/leather-bags/leather-bags-page.component').then(
            m => m.LeatherBagsPageComponent
          ),
        data: {
          seo: {
            titleKey: 'seo_leather_bags_title',
            descriptionKey: 'seo_leather_bags_description',
          },
        },
      },
      {
        path: 'leather-bags/:id',
        loadComponent: () =>
          import('@features/product-detail/product-detail-page.component').then(
            m => m.ProductDetailPageComponent
          ),
        data: {
          seo: {
            titleKey: 'seo_leather_bags_title',
            descriptionKey: 'seo_leather_bags_description',
          },
        },
      },
      {
        path: 'eva-material',
        loadComponent: () =>
          import('@features/eva-material/eva-material-page.component').then(
            m => m.EvaMaterialPageComponent
          ),
        data: {
          seo: {
            titleKey: 'seo_eva_material_title',
            descriptionKey: 'seo_eva_material_description',
          },
        },
      },

      // Legal pages (English slugs; old German slugs redirect here below).
      {
        path: 'imprint',
        loadComponent: () =>
          import('@features/legal/imprint-page/imprint-page.component').then(
            m => m.ImprintPageComponent
          ),
        data: { seo: { titleKey: 'seo_imprint_title', descriptionKey: 'seo_imprint_description' } },
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('@features/legal/privacy-policy-page/privacy-policy-page.component').then(
            m => m.PrivacyPolicyPageComponent
          ),
        data: { seo: { titleKey: 'seo_privacy_title', descriptionKey: 'seo_privacy_description' } },
      },
      {
        path: 'terms',
        loadComponent: () =>
          import('@features/legal/terms-page/terms-page.component').then(m => m.TermsPageComponent),
        data: { seo: { titleKey: 'seo_terms_title', descriptionKey: 'seo_terms_description' } },
      },
      {
        path: 'withdrawal',
        loadComponent: () =>
          import('@features/legal/withdrawal-page/withdrawal-page.component').then(
            m => m.WithdrawalPageComponent
          ),
        data: {
          seo: { titleKey: 'seo_withdrawal_title', descriptionKey: 'seo_withdrawal_description' },
        },
      },

      // Redirects from the old German slugs to the new English routes (so
      // existing links / bookmarks keep working instead of hitting 404).
      { path: 'katalog', redirectTo: 'catalog', pathMatch: 'full' },
      { path: 'konfigurator', redirectTo: 'configurator', pathMatch: 'full' },
      { path: 'warenkorb', redirectTo: 'cart', pathMatch: 'full' },
      { path: 'konto', redirectTo: 'account', pathMatch: 'full' },
      { path: 'kontakt', redirectTo: 'contact', pathMatch: 'full' },
      { path: 'kissen', redirectTo: 'cushions', pathMatch: 'full' },
      { path: 'taschen-eva', redirectTo: 'eva-bags', pathMatch: 'full' },
      { path: 'taschen-leder', redirectTo: 'leather-bags', pathMatch: 'full' },
      // Legal pages (English slugs; components land in a later stage).
      { path: 'impressum', redirectTo: 'imprint', pathMatch: 'full' },
      { path: 'datenschutz', redirectTo: 'privacy-policy', pathMatch: 'full' },
      { path: 'agb', redirectTo: 'terms', pathMatch: 'full' },
      { path: 'widerruf', redirectTo: 'withdrawal', pathMatch: 'full' },

      {
        path: '**',
        loadComponent: () =>
          import('@features/not-found/not-found-page.component').then(m => m.NotFoundPageComponent),
        title: 'Seite nicht gefunden — NEOMATTEN',
      },
    ],
  },
];
