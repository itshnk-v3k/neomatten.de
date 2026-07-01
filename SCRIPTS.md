# npm scripts

Reference for the root `package.json` scripts, grouped by category. Backend has
its own scripts under `backend/package.json` (run from inside `backend/`); the
`dev:backend` / `build:backend` scripts below delegate to them.

## Dev

| Script                    | What it does                                                                |
| ------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`             | App + admin + backend concurrently in one terminal (labeled APP/ADMIN/API). |
| `npm run dev:app`         | App dev server, `development` config, on `http://localhost:4200`.           |
| `npm run dev:app:staging` | App dev server, `staging` config, with the staging proxy.                   |
| `npm run dev:admin`       | Admin dev server on `http://localhost:4300`.                                |
| `npm run dev:backend`     | Backend (NestJS) in watch mode (`backend` → `start:dev`).                   |

## Build

| Script                      | What it does                                             |
| --------------------------- | -------------------------------------------------------- |
| `npm run build:app`         | App production build → `dist/neomatten/`.                |
| `npm run build:app:dev`     | App development build.                                   |
| `npm run build:app:staging` | App staging build.                                       |
| `npm run build:app:watch`   | App development build in watch mode.                     |
| `npm run build:admin`       | Admin production build → `dist/neomatten-admin/`.        |
| `npm run build:backend`     | Backend production build (`backend` → `build`).          |
| `npm run preview:prod`      | Production build, then serve it locally via `npx serve`. |

## Test

| Script     | What it does                                        |
| ---------- | --------------------------------------------------- |
| `npm test` | Unit tests (Vitest via `@angular/build:unit-test`). |

## Lint

| Script                 | What it does                                                                |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run lint`         | ESLint over the workspace, then the custom no-`::ng-deep` style check.      |
| `npm run lint:fix`     | ESLint with autofix.                                                        |
| `npm run lint:styles`  | Custom style check only (usually invoked by `lint`, but callable directly). |
| `npm run format`       | Prettier write over `projects/**`.                                          |
| `npm run format:check` | Prettier check (CI-friendly).                                               |

## Utility

| Script                    | What it does                                              |
| ------------------------- | --------------------------------------------------------- |
| `npm run ng`              | Passthrough to the Angular CLI.                           |
| `npm run build:data`      | Regenerate the vehicle mock dataset from the xlsx export. |
| `npm run optimize:images` | Optimize/convert source images (Sharp).                   |
