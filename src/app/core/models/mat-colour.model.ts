/*
 * EN: Configurator colour palette. A mat colour (fill) or edge colour (border)
 *     with a bilingual display name and a swatch hex. Today the palette is loaded
 *     from a mock JSON file (see ConfiguratorService); when the backend lands it
 *     comes from `GET /api/settings/colours`, managed via the admin panel.
 * RU: Палитра цветов конфигуратора. Цвет коврика (заливка) или канта (рамка) с
 *     двуязычным названием и HEX образца. Сейчас палитра грузится из мок-JSON
 *     (см. ConfiguratorService); с бэкендом придёт из `GET /api/settings/colours`,
 *     управляется через админку.
 */

/** A single configurator colour (mat fill or edge border). */
export interface MatColour {
  readonly id: string;
  readonly name_en: string;
  readonly name_de: string;
  /** Swatch hex, e.g. "#66ce33". */
  readonly hex: string;
}

/** The colour palette payload (mat fills + edge borders). */
export interface MatColoursData {
  readonly mat_colours: MatColour[];
  readonly edge_colours: MatColour[];
}
