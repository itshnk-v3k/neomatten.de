/*
 * EN: Admin-managed media asset. The shape every backend/CDN-served image maps
 *     to (hero, gallery, product photos, brand logos, mat previews). Today the
 *     app uses placeholder URLs (see MediaService); when the backend lands these
 *     objects come from `GET /api/media`, uploaded/managed via the admin panel.
 * RU: Медиа-ресурс, управляемый из админки. Форма, к которой приводится любое
 *     изображение с бэкенда/CDN (герой, галерея, фото товаров, логотипы марок,
 *     превью ковриков). Сейчас приложение использует URL-заглушки (см. MediaService);
 *     с появлением бэкенда эти объекты приходят из `GET /api/media`, загружаются
 *     и управляются через админку.
 */

/** A single admin-managed image asset (maps to a future `media` table). */
export interface MediaAsset {
  readonly id: string;
  /** Full URL from the backend / CDN. */
  readonly url: string;
  /** Alt text (already translated for the active language). */
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly mimeType?: string;
  /** ISO timestamp of the admin upload. */
  readonly uploadedAt?: string;
}
