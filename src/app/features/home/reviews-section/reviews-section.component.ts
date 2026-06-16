/*
 * EN: Home reviews section. The reviews embla carousel (nm-reviews) is heavy and
 *     only mounts once scrolled near (nmLazySection); a skeleton card grid stands
 *     in until then.
 * RU: Секция отзывов главной. Карусель отзывов embla (nm-reviews) тяжёлая и
 *     монтируется только при приближении прокрутки (nmLazySection); до этого —
 *     скелетон-сетка карточек.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { LazySectionDirective } from '@shared/directives/lazy-section.directive';

import { ReviewsComponent } from '../reviews/reviews.component';

@Component({
  selector: 'nm-home-reviews',
  imports: [LazySectionDirective, SkeletonComponent, ReviewsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reviews-section.component.html',
  styleUrl: './reviews-section.component.scss',
})
export class ReviewsSectionComponent {
  /** The reviews carousel defers instantiation until scrolled near (nmLazySection). */
  protected readonly reviewsVisible = signal(false);
}
