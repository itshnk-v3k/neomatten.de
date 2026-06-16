/*
 * EN: Signal-based customer reviews store. Seeds three demo reviews, persists
 *     submissions to localStorage and exposes the list + count as signals. A mock
 *     seam for the future backend reviews API. Ports the legacy reviews.js.
 * RU: Хранилище отзывов на сигналах. Засевает три демо-отзыва, сохраняет
 *     отправленные в localStorage и предоставляет список + количество как сигналы.
 *     Точка подмены под будущий API отзывов бэкенда. Портирует reviews.js.
 */
import { computed, effect, Injectable, signal } from '@angular/core';
import type { Review } from '@core/models/review.model';

const REVIEWS_STORAGE_KEY = 'neomatten_reviews';

/**
 * Demo reviews shown until a visitor adds their own. Authentic customer wording
 * is kept verbatim (not translated), like other testimonial/brand content.
 */
const DEFAULT_REVIEWS: readonly Review[] = [
  {
    name: 'Markus S.',
    text: 'Perfekte Passform, hochwertige Qualität! Die Matten sitzen genau und lassen sich sehr leicht reinigen.',
    rating: 5,
    date: '12.05.2024',
  },
  {
    name: 'Birgit R.',
    text: 'Sehr schöne Matten, passen hervorragend ins Auto. Schnelle Lieferung und toller Kundenservice.',
    rating: 5,
    date: '03.05.2024',
  },
  {
    name: 'Thomas M.',
    text: 'Gutes Preis-Leistungs-Verhältnis. Material ist robust und wie beschrieben. Gerne wieder!',
    rating: 4,
    date: '28.04.2024',
  },
];

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly reviewsSignal = signal<Review[]>(this.restore());

  /** Read-only review list (newest first). */
  readonly reviews = this.reviewsSignal.asReadonly();

  /** Number of stored reviews. */
  readonly count = computed(() => this.reviewsSignal().length);

  private readonly loadingSignal = signal(true);
  /** True while reviews load; flips false after a short delay (mock). */
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    // Persist on every change.
    effect(() => this.persist(this.reviewsSignal()));
    // Mock loading delay so skeleton states are visible during development.
    // TODO(backend): drive `loading` from the reviews API request lifecycle.
    setTimeout(() => this.loadingSignal.set(false), 600);
  }

  /**
   * Prepends a new review (newest first).
   * TODO(backend): replace with `this.api.post<Review>('/reviews', review)` and
   * refresh from the server (reviews are moderated/admin-managed).
   */
  add(review: Review): void {
    this.reviewsSignal.update(reviews => [review, ...reviews]);
  }

  // TODO(backend): seed/restore should be replaced by `GET /api/reviews`
  // (the DEFAULT_REVIEWS below are demo seed data, not real content).
  private restore(): Review[] {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Review[]) : [...DEFAULT_REVIEWS];
    } catch {
      return [...DEFAULT_REVIEWS];
    }
  }

  private persist(reviews: Review[]): void {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // Ignore storage write failures (e.g. private mode quota).
    }
  }
}
