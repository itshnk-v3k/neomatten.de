# NEOMATTEN

Frontend for **NEOMATTEN** — a custom **EVA car-mat** e-commerce site for the
German / European market (DE/EN). Users browse a catalogue, configure
made-to-measure mats in a live configurator, and order them. This repository is
the Angular migration of the original static HTML/CSS/JS prototype.

> **Status:** front-end only. The backend (**.NET / C# / PostgreSQL**) and the
> admin panel are a later stage. The code is structured so they can be plugged
> in with minimal change (see [Backend readiness](#backend-readiness)).

---

## Tech stack

- **Angular 22** — standalone components, lazy-loaded routes, new control flow
  (`@if` / `@for` / `@switch`), signals + RxJS for state. No NgModules.
- **TypeScript** (strict) — path aliases `@core`, `@shared`, `@features`,
  `@layout`, `@env`.
- **SCSS** for component styles; **Tailwind CSS 3.4** (pinned) for utilities.
- **ZardUI** (shadcn-style) for the shared UI kit — see
  [UI kit & icons](#ui-kit--icons).
- **lucide-angular** for icons.
- **Reactive Forms** for every form on the site.

---

## Prerequisites & setup

- **Node.js** ≥ 20 (developed on Node 26) and **npm** ≥ 10.
- Install dependencies:

  ```bash
  npm install
  ```

---

## Available scripts

| Script                  | What it does                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| `npm start`             | Dev server (`development` config) on `http://localhost:4200`.       |
| `npm run start:staging` | Dev server using the `staging` configuration.                       |
| `npm run start:prod`    | Production build, then serves it locally with `npx serve`.          |
| `npm run build`         | Production build → `dist/neomatten/`.                               |
| `npm run build:dev`     | Development build.                                                   |
| `npm run build:staging` | Staging build.                                                      |
| `npm run watch`         | Development build in watch mode.                                    |
| `npm run build:data`    | Regenerate vehicle mock data (see [Vehicle data](#vehicle-data)).   |
| `npm test`              | Unit tests (Vitest via `@angular/build:unit-test`).                 |
| `npm run lint`          | ESLint over `src/**/*.{ts,html}`.                                   |
| `npm run lint:fix`      | ESLint with autofix.                                                |
| `npm run format`        | Prettier write over `src`.                                          |
| `npm run format:check`  | Prettier check (CI-friendly).                                       |

---

## Project structure

```text
src/
  app/
    core/        # singleton services, models/DTOs, HTTP infra, guards, interceptors
      http/      # api-base-url.interceptor.ts, base API service, mock providers
      i18n/      # TranslationService + language model
    shared/
      components/# ZardUI-style reusable UI kit (button, input, select, dialog,
                 # sheet, accordion, tooltip, toaster, phone-input, badge, …)
      services/  # toast service, validation-error-messages service
      validators/# reusable Reactive Forms validators (phone, match, …)
      pipes/     # translate pipe
      models/    # shared interfaces (e.g. SelectOption)
      utils/     # cn() and other helpers
    layout/      # shell, header, footer, announce-bar, mobile-menu
    features/    # one folder per page (home, catalog, configurator, cart, …)
    app.ts             # root component (selector: nm-root)
    app.config.ts      # application providers (router, http, animations)
    app.routes.ts      # lazy, English-slug route table (old German slugs redirect) wrapped by the Shell layout
  assets/
    i18n/{de,en}/      # translation dictionaries (JSON, per namespace)
    mock-data/         # JSON fixtures standing in for the future backend
    logo/              # brand logos
  environments/        # environment.ts + .dev / .staging / .prod
  styles.scss          # global styles + brand design tokens (CSS custom properties)
```

Component selectors use the **`nm-`** prefix; attribute directives use `nm`.

> **Migration complete.** All pages have been ported from the original static
> prototype to Angular. The legacy root `*.html` files and the `css/` + `js/`
> folders have been **removed** — the prototype lives only in git history
> (initial commit). The design/structure/content source of truth is now the
> Angular components themselves.

---

## Routes

English URL slugs; old German slugs redirect (so existing links don't 404). UI
copy still switches DE/EN. Every page sets its title + meta via `SeoService`
from the route's `data.seo` (`titleKey` / `descriptionKey`), not a static title.

| Path                       | Page                              | Notes                                              |
| -------------------------- | --------------------------------- | -------------------------------------------------- |
| `/`                        | Home                              |                                                    |
| `/catalog`                 | Catalogue (brand grid)            | search filters brands → configurator               |
| `/configurator`            | Brand selection                   | circular brand cards                               |
| `/configurator/:brand`     | 12-step configurator              | preview + clickable car diagram + checkout         |
| `/cart`                    | Cart                              | quantity, shipping, 10% discount, checkout         |
| `/account`                 | Account dashboard                 | `authGuard` — orders + profile                     |
| `/account/login`           | Sign in                           | `guestGuard`                                       |
| `/account/register`        | Register                          | `guestGuard` — sets `firstOrderDiscount`           |
| `/account/forgot-password` | Reset password                    | mock                                               |
| `/contact`                 | Contact                           | company info + Leaflet map + form                  |
| `/faq`                     | FAQ                               | accordion (7 Q&A)                                  |
| `/eva-material`            | EVA material info                 | reasons, ISO cert, CTA                             |
| `/cushions`                | Headrest cushions (listing)       | `/cushions/:id` → product detail                   |
| `/eva-bags`                | EVA bags landing                  | with-lid / without-lid category cards              |
| `/eva-bags/with-lid`       | EVA bags (with lid)               | listing                                            |
| `/eva-bags/without-lid`    | EVA bags (without lid)            | listing; `/eva-bags/:id` → product detail          |
| `/leather-bags`            | EVA-leather bags (listing)        | `/leather-bags/:id` → product detail               |
| `**`                       | Not found (404)                   |                                                    |

Redirects: `/katalog`→`/catalog`, `/konfigurator`→`/configurator`,
`/warenkorb`→`/cart`, `/konto`→`/account`, `/kontakt`→`/contact`,
`/kissen`→`/cushions`, `/taschen-eva`→`/eva-bags`, `/taschen-leder`→`/leather-bags`.

---

## Vehicle data

The catalogue + configurator are driven by a normalized dataset under
`src/assets/mock-data/` (`vehicle-patterns.json`, `brands.json`). To regenerate
it from the source spreadsheet, run:

```bash
npm run build:data
```

This runs `scripts/build-vehicle-data.mjs`, which reads the client's source JSON
and writes the normalized flat `vehicle-patterns.json` + `brands.json` consumed
by `VehicleService`. Simple products (cushions, bags) live in a hand-authored
`products.json` and are not regenerated by this script.

---

## Internationalization (i18n)

The site UI is bilingual **German / English** (the codebase itself is English).

- Translation copy lives in `src/assets/i18n/<lang>/<namespace>.json`
  (e.g. `de/common.json`, `en/common.json`). Keys are flat **`snake_case`**
  (e.g. `header_nav_catalog`, `action_add_to_cart`). Namespaces are registered
  in `TRANSLATION_NAMESPACES` (`src/app/core/i18n/language.model.ts`).
- `TranslationService` (signal-based, `src/app/core/i18n/`) loads/merges the
  dictionaries, exposes the active language, and persists the choice in a
  cookie. Use the **`translate` pipe** in templates:
  `{{ 'header_nav_catalog' | translate }}`. Every user-facing string must go
  through a key (so the future admin panel can edit any copy).

**Add or edit a translation key:**

1. Add the key (same name) to **both** `de/<namespace>.json` and
   `en/<namespace>.json`.
2. Reference it in the template via the `translate` pipe:
   `{{ 'my_key' | translate }}`.
3. For a new section, add a `<namespace>.json` in both `de/` and `en/`, then add
   the namespace to `TRANSLATION_NAMESPACES`.

---

## Environments

Three build configurations, each backed by a file in `src/environments/`:

| Config        | File                       | `apiBaseUrl`                      | Notes                          |
| ------------- | -------------------------- | --------------------------------- | ------------------------------ |
| `development` | `environment.dev.ts`       | `''` (mock data / same origin)    | default for `npm start`        |
| `staging`     | `environment.staging.ts`   | `https://staging-api.neomatten.de`| prod-like, source maps on      |
| `production`  | `environment.prod.ts`      | `https://api.neomatten.de`        | optimized build                |

`environment.ts` is the type-checked default (mirrors development) and is
swapped per build via `fileReplacements` in `angular.json`. All environments
satisfy the `Environment` interface in `environment.model.ts`, which also
carries **feature flags** (`useMockData`, `cookieBanner`, `debug`) and the
default language.

**Add a new environment** (e.g. `qa`):

1. Create `src/environments/environment.qa.ts` implementing `Environment`.
2. Add a `qa` configuration under `architect.build.configurations` and
   `architect.serve.configurations` in `angular.json`, with the matching
   `fileReplacements` entry.
3. Add npm scripts (`build:qa`, optionally `start:qa`).

**Change a config value:** edit the relevant `environment.*.ts` file — never
read environment values directly from `process`/`window`; always import from
`@env/environment`.

---

## UI kit & icons

- **ZardUI** — a shadcn-style, Tailwind-based component set for Angular. Chosen
  because it fits the existing Tailwind stack, ships components as editable
  source (copied into `src/app/shared/ui`, built on
  `class-variance-authority` + `clsx` + `tailwind-merge`, all already in
  `package.json`), and has no heavyweight runtime — unlike the excluded
  Angular Material / PrimeNG / ng-bootstrap / ng-zorro. All inputs, selects,
  dropdowns, dialogs, etc. go through this single set for consistent styling.
- **lucide-angular** for icons (tree-shakeable, matches the design).
- The `cn()` helper (`@shared/utils/cn`) merges variant and consumer classes
  with Tailwind conflict resolution.

---

## Backend readiness

- All HTTP goes through `@angular/common/http` with the
  `apiBaseUrlInterceptor`, which resolves relative URLs against
  `environment.apiBaseUrl`. Feature services stay environment-agnostic.
- Data that will eventually be admin-managed (vehicle brands/models,
  configurator options, product images, brand logos) is modeled now with
  typed DTOs + services backed by `src/assets/mock-data/*.json`. Switching to
  the real backend means flipping `useMockData` to `false` and setting
  `apiBaseUrl` — call shapes don't change.
- Auth is a mock (session/token in `localStorage` via `AuthService`) modeled
  with DTOs and an `AuthGuard`, so swapping to real .NET auth is a small change.

---

## Conventions

- Standalone components, `ChangeDetectionStrategy.OnPush`, signals for state.
- Reactive Forms (`FormGroup` / `FormControl` / `FormBuilder` + `Validators`)
  for all forms. The shared form controls implement `ControlValueAccessor`, so
  they bind directly via `formControlName`.
- **File naming:** classic suffixes — `*.component.ts` (+ separate
  `.component.html` / `.component.scss`, no inline template/styles except rare
  justified cases), `*.service.ts`, `*.pipe.ts`, `*.directive.ts`,
  `*.guard.ts`, `*.interceptor.ts`. Routed pages are `*-page.component.ts`.
  Kebab-case folders, one feature/component per folder.
- **Selectors/prefix:** components `nm-…`, attribute directives `nm…`.
- **File headers:** every source file starts with a short 2–3 sentence header
  comment in both English and Russian.
- **Styling:** Tailwind utilities directly in templates (no `@apply`). Brand
  tokens are defined in `tailwind.config.cjs` (single source of truth) and
  mirrored as CSS variables only where utilities can't reach.
- Imports sorted (`simple-import-sort`), unused imports flagged
  (`unused-imports`); type-only imports enforced.
- Run `npm run lint` and `npm run format:check` before committing.
