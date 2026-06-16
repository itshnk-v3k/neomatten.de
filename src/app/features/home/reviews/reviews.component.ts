/*
 * EN: Customer reviews section. Shows a rating summary (real review count), an
 *     embla carousel of review cards (1/2/3 per view; mouse drag disabled on
 *     desktop, swipe kept on touch) and an "add review" dialog with a star
 *     rating, name and text. Persists via ReviewService. Ports reviews.js.
 * RU: Секция отзывов клиентов. Показывает сводку рейтинга (реальное число
 *     отзывов), embla-карусель карточек (1/2/3 на вид; перетаскивание мышью
 *     отключено на десктопе, свайп на тач сохранён) и диалог «добавить отзыв» со
 *     звёздами, именем и текстом. Сохраняет через ReviewService. Портирует reviews.js.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ReviewService } from '@core/services/review.service';
import { LucideChevronLeft, LucideChevronRight, LucidePlus } from '@lucide/angular';
import { AuthDialogComponent } from '@shared/components/auth-dialog/auth-dialog.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { InputComponent } from '@shared/components/input/input.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TextareaComponent } from '@shared/components/textarea/textarea.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { createAsyncAction } from '@shared/utils/async-action.util';
import type { EmblaOptionsType } from 'embla-carousel';
import { EmblaCarouselDirective } from 'embla-carousel-angular';

@Component({
  selector: 'nm-reviews',
  imports: [
    ReactiveFormsModule,
    EmblaCarouselDirective,
    AuthDialogComponent,
    DialogComponent,
    InputComponent,
    SkeletonComponent,
    TextareaComponent,
    ButtonDirective,
    TranslatePipe,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePlus,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent {
  private readonly reviewService = inject(ReviewService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly reviews = this.reviewService.reviews;
  /** Drives the carousel skeleton placeholder while reviews load. */
  protected readonly loading = this.reviewService.loading;
  /** Real number of reviews (drives the rating-summary count). */
  protected readonly reviewCount = this.reviewService.count;
  protected readonly stars = [1, 2, 3, 4, 5] as const;

  // Drag enabled on touch only — disables mouse drag on desktop, keeps swipe on
  // mobile. Passed at initialization via [options]; embla reads watchDrag when it
  // sets up the pointer handlers, so this must be present on the initial options
  // object (not patched later). Non-pointer drag events (no pointerType) return
  // false so a mouse never starts a drag.
  protected readonly options: EmblaOptionsType = {
    align: 'start',
    loop: false,
    watchDrag: (_emblaApi, event) => {
      // Allow finger/touch drag (swipe) on mobile; block mouse drag on desktop.
      if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
        return true;
      }
      if ('pointerType' in event) {
        return (event as PointerEvent).pointerType === 'touch';
      }
      return false;
    },
  };
  protected readonly selected = signal(0);
  protected readonly snapCount = signal(0);
  protected readonly snaps = computed(() => Array.from({ length: this.snapCount() }, (_, i) => i));
  /** Drive the prev/next arrow disabled state from embla's scroll boundaries. */
  protected readonly canPrev = signal(false);
  protected readonly canNext = signal(false);

  private readonly embla = viewChild.required(EmblaCarouselDirective);

  // Auth dialog state — opened from the guest "sign in to review" prompt. The
  // dialog defaults to its login tab and closes on success, leaving the user on
  // the page with the add-review button now visible (no navigation needed).
  protected readonly authOpen = signal(false);

  // Add-review dialog state.
  protected readonly dialogOpen = signal(false);
  protected readonly rating = signal(5);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    text: ['', Validators.required],
  });

  protected prev(): void {
    this.embla().goToPrev();
  }

  protected next(): void {
    this.embla().goToNext();
  }

  protected goTo(index: number): void {
    this.embla().goTo(index);
  }

  protected onEmblaChange(): void {
    const api = this.embla().emblaApi;
    if (api) {
      this.snapCount.set(api.scrollSnapList().length);
      this.selected.set(api.selectedScrollSnap());
      this.canPrev.set(api.canScrollPrev());
      this.canNext.set(api.canScrollNext());
    }
  }

  protected openAuthDialog(): void {
    this.authOpen.set(true);
  }

  protected openDialog(): void {
    this.form.reset();
    // Pre-fill the name from the signed-in user and lock it (no impersonation).
    const user = this.auth.user();
    if (user) {
      this.form.controls.name.setValue(user.name);
      this.form.controls.name.disable();
    }
    this.rating.set(5);
    this.dialogOpen.set(true);
  }

  protected setRating(value: number): void {
    this.rating.set(value);
  }

  /** Guarded submit (minDurationMs floor blocks a rapid double-submit before the
   *  dialog closes, which would otherwise post the review twice). */
  protected readonly submitAction = createAsyncAction(
    () => {
      const { name, text } = this.form.getRawValue();
      this.reviewService.add({
        name: name.trim(),
        text: text.trim(),
        rating: this.rating(),
        date: new Date().toLocaleDateString('de-DE'),
      });
      this.toast.success('home_reviews_success');
      this.dialogOpen.set(false);
    },
    { minDurationMs: 500 }
  );

  protected submit(): void {
    if (this.form.invalid) {
      // Reveal inline field errors and warn via a toast; block submission.
      this.form.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    void this.submitAction.execute();
  }
}
