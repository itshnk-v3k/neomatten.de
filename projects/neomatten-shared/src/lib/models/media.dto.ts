/**
 * Admin-managed media asset — the shape every backend/CDN-served image maps to
 * (hero, gallery, product photos, brand logos, mat previews). Served by the
 * backend `GET /api/media`, uploaded/managed via the admin panel.
 *
 * Maps to the Prisma `Media` concept (admin-managed assets).
 */
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
