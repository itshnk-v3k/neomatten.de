/*
 * EN: EVA-material information page. Explains the certified EVA material — hero
 *     intro, six reasons (icon cards), the ISO 9001:2015 certification block with
 *     a certificate download, "Why NEOMAT?" points, and a CTA to the
 *     configurator. All copy renders via the translate pipe (DE/EN).
 * RU: Информационная страница EVA-материала. Рассказывает о сертифицированном
 *     EVA-материале — герой-вступление, шесть причин (карточки с иконками), блок
 *     сертификации ISO 9001:2015 со скачиванием сертификата, пункты «Почему
 *     NEOMAT?» и призыв к конфигуратору. Весь текст — через пайп translate (DE/EN).
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBadgeCheck,
  LucideDroplets,
  LucideFileText,
  LucideLeaf,
  LucideShieldCheck,
  LucideSparkles,
  LucideThermometer,
} from '@lucide/angular';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/** A single "Why NEOMAT?" point (rendered with a bullet, no icon). */
interface WhyPoint {
  readonly titleKey: string;
  readonly textKey: string;
}

@Component({
  selector: 'nm-eva-material-page',
  imports: [
    RouterLink,
    LucideThermometer,
    LucideDroplets,
    LucideLeaf,
    LucideSparkles,
    LucideShieldCheck,
    LucideBadgeCheck,
    LucideFileText,
    LucideArrowRight,
    ButtonDirective,
    BreadcrumbComponent,
    SkeletonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eva-material-page.component.html',
  styleUrl: './eva-material-page.component.scss',
})
export class EvaMaterialPageComponent {
  /** Path to the ISO 9001:2015 certificate PDF in assets. */
  protected readonly certificateUrl = 'assets/docs/iso-9001-certificate.pdf';

  protected readonly whyPoints: readonly WhyPoint[] = [
    { titleKey: 'eva_why_direct_title', textKey: 'eva_why_direct_text' },
    { titleKey: 'eva_why_quality_title', textKey: 'eva_why_quality_text' },
    { titleKey: 'eva_why_safety_title', textKey: 'eva_why_safety_text' },
  ];

  /** Local loading flag (no backing service): briefly shows skeletons on render. */
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => setTimeout(() => this.loading.set(false), 600));
  }
}
