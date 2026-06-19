/*
 * EN: Gallery album dialog. Opens from a work-gallery slide and shows every photo
 *     in the album as a captioned grid inside the shared nm-dialog (full-screen on
 *     mobile, large card on desktop). Images are admin-managed placeholders until
 *     real photos arrive.
 * RU: Диалог альбома галереи. Открывается со слайда галереи работ и показывает все
 *     фото альбома сеткой с подписями внутри общего nm-dialog (полноэкранно на
 *     мобиле, большая карточка на десктопе). Изображения — заглушки из админки до
 *     появления реальных фото.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';

import type { GalleryAlbum } from '../gallery/gallery.component';

@Component({
  selector: 'nm-gallery-album-dialog',
  imports: [NgOptimizedImage, DialogComponent, ImagePlaceholderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery-album-dialog.component.html',
})
export class GalleryAlbumDialogComponent {
  /** Two-way open state. */
  readonly open = model<boolean>(false);
  /** The album to show, or null when closed. */
  readonly album = input<GalleryAlbum | null>(null);

  /**
   * EN: Indices of album images that failed to load → render the placeholder.
   * RU: Индексы изображений альбома, которые не загрузились → заглушка.
   */
  private readonly failed = signal<ReadonlySet<number>>(new Set());

  protected hasFailed(i: number): boolean {
    return this.failed().has(i);
  }

  protected onImageError(i: number): void {
    this.failed.update(s => new Set(s).add(i));
  }
}
