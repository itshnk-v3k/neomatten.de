/*
 * EN: Home reviews section. The reviews embla carousel (nm-reviews) is heavy, so
 *     it is code-split and only loaded once scrolled into view (@defer on
 *     viewport); a skeleton card grid stands in until then.
 * RU: Секция отзывов главной. Карусель отзывов embla (nm-reviews) тяжёлая,
 *     поэтому выносится в отдельный чанк и грузится при попадании в видимую
 *     область (@defer on viewport); до этого — скелетон-сетка карточек.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

import { ReviewsComponent } from '../reviews/reviews.component';

@Component({
  selector: 'nm-home-reviews',
  imports: [SkeletonComponent, ReviewsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reviews-section.component.html',
  styleUrl: './reviews-section.component.scss',
})
export class ReviewsSectionComponent {}
