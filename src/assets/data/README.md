# Mock data

Local JSON fixtures that stand in for the future backend (.NET/C#/PostgreSQL)
and admin panel. Feature services load these via `HttpClient` when
`environment.features.useMockData` is `true`.

Files are added per feature as pages are migrated:

- `vehicle-patterns.json` — normalized flat list of mat patterns (configurator /
  catalog). **Generated** from the client export by `npm run build:data`
  (see `scripts/build-vehicle-data.mjs`); do not edit by hand.
- `brands.json` — brand index with model/pattern counts. Also generated.
- `configurator-options.json` — textures, colors, sets, surcharges, delivery (future)
- `products.json` — cushions and bags (future)
- `faq.json` — FAQ entries (future)
- `reviews.json` — seed customer reviews (future)

To switch to the real backend later, flip `useMockData` to `false` and point
`apiBaseUrl` at the API — services keep the same call shape, so only the data
source URL changes.
