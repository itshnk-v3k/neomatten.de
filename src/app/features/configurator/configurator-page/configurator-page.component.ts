/*
 * EN: Product configurator. Two columns: left = mat preview + clickable car
 *     diagram (synced to the step-07 kit builder); right = the 12 steps (vehicle
 *     info, refine spec, material, texture, colours, kit, accessories, mounting,
 *     heel pad, delivery, summary). Pricing is a reactive computed from
 *     ConfiguratorService's mock table. "Add to cart" is always available; "Pay
 *     now" / "Contact manager" are auth-gated — when signed out they open the
 *     auth dialog and replay the pending action after login.
 * RU: Конфигуратор товара. Две колонки: слева — превью коврика + кликабельная
 *     схема авто (синхронны с конструктором набора, шаг 07); справа — 12 шагов
 *     (инфо об авто, уточнение, материал, фактура, цвета, набор, аксессуары,
 *     крепление, подпятник, доставка, итог). Цена — реактивный computed из
 *     мок-таблицы ConfiguratorService. «В корзину» доступно всегда; «Оплатить» /
 *     «Связаться с менеджером» — за авторизацией: для гостя открывают диалог
 *     входа и повторяют отложенное действие после входа.
 */
import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslationService } from '@core/i18n/translation.service';
import type { MatColour } from '@core/models/mat-colour.model';
import type { PaymentMethod } from '@core/models/order.model';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { VehicleService } from '@core/services/vehicle.service';
import { LucideInfo } from '@lucide/angular';
import { AccordionComponent } from '@shared/components/accordion/accordion.component';
import { AccordionItemComponent } from '@shared/components/accordion-item/accordion-item.component';
import { AuthDialogComponent } from '@shared/components/auth-dialog/auth-dialog.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';
import { PaymentDialogComponent } from '@shared/components/payment-dialog/payment-dialog.component';
import { SelectComponent } from '@shared/components/select/select.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TooltipDirective } from '@shared/components/tooltip/tooltip.directive';
import type { SelectOption } from '@shared/models/select-option.model';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { createAsyncAction } from '@shared/utils/async-action.util';
import { round2 } from '@shared/utils/money.util';

import {
  ConfigDetailsComponent,
  type ConfigDetailsVM,
} from '../config-details/config-details.component';
import {
  type Accessories,
  CAR_ZONES,
  type CarZone,
  type ConfigState,
  ConfiguratorService,
  HEEL_REST_RUBBER_COLOURS,
  type HeelPadAccessory,
  type HeelRest,
  type KitPreset,
  type MaterialType,
  type Mounting,
  type Texture,
  TEXTURES,
} from '../configurator.service';
import { ConfiguratorInfoDialogsComponent } from '../configurator-info-dialogs/configurator-info-dialogs.component';
import { ConfiguratorPreviewComponent } from '../configurator-preview/configurator-preview.component';

@Component({
  selector: 'nm-configurator-page',
  imports: [
    ReactiveFormsModule,
    BreadcrumbComponent,
    SelectComponent,
    ButtonDirective,
    BadgeComponent,
    ImagePlaceholderComponent,
    AccordionComponent,
    AccordionItemComponent,
    AuthDialogComponent,
    PaymentDialogComponent,
    ConfiguratorPreviewComponent,
    ConfigDetailsComponent,
    ConfiguratorInfoDialogsComponent,
    SkeletonComponent,
    TooltipDirective,
    LucideInfo,
    TranslatePipe,
    EuroPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './configurator-page.component.html',
  styleUrl: './configurator-page.component.scss',
})
export class ConfiguratorPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly vehicles = inject(VehicleService);
  private readonly config = inject(ConfiguratorService);
  private readonly cart = inject(CartService);
  private readonly checkout = inject(CheckoutService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);

  /** Brand id from `/configurator/:brand`. */
  readonly brand = input<string>('');

  protected readonly loaded = this.vehicles.loaded;
  /** Either source still loading → show the two-column skeleton. */
  protected readonly loading = computed(() => this.config.loading() || this.vehicles.loading());
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly certificateUrl = 'assets/docs/iso-9001-certificate.pdf';

  // Static option tables (exposed to the template).
  protected readonly textures = TEXTURES;
  // Edge colour palette loaded at runtime (empty until the load resolves). Mat
  // colours are texture-scoped — see availableMatColours.
  protected readonly edgeColours = this.config.edgeColours;
  /** Mat (fill) colours available for the current texture (+ size). Step-05 list. */
  protected readonly availableMatColours = computed(() =>
    this.config.matColoursFor(this.texture(), this.matSize() === '210x140')
  );
  protected readonly transmissionOptions = this.config.transmissionOptions;
  protected readonly driveOptions = this.config.driveOptions;
  protected readonly engineOptions = this.config.engineOptions;

  // --- vehicle selection (step 01) + refine spec (step 02) -------------------
  protected readonly form = this.fb.nonNullable.group({
    brandId: [''],
    model: [''],
    yearLabel: [''],
    // Step-02 refine spec (optional/informational). Year-of-manufacture starts
    // disabled — it's only choosable once the vehicle's year range is resolved.
    transmission: [''],
    yearOfManufacture: [{ value: '', disabled: true }],
    drive: [''],
    engine: [''],
  });
  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  // --- configuration choices (signals) --------------------------------------
  protected readonly material = signal<MaterialType>('eva');
  protected readonly texture = signal<Texture>('rhombus');
  protected readonly materialColor = signal<string>('black');
  protected readonly edgeColor = signal<string>('black');
  /**
   * Selected mat size. Colours offered in the larger 210x140 are a subset, so this
   * further filters the palette. No size selector exists yet → defaults to the
   * standard size (all of the texture's colours available).
   */
  protected readonly matSize = signal<string>('200x120');
  protected readonly zones = signal<ReadonlySet<CarZone>>(new Set(['front_left', 'front_right']));
  protected readonly accessories = signal<Accessories>('with_clips');
  protected readonly mounting = signal<Mounting>('none');
  protected readonly heelPad = signal<HeelPadAccessory>('none');
  protected readonly heelRest = signal<HeelRest>('none');
  /** Selected rubber heel-rest colour id (step 09); null unless Rubber is chosen. */
  protected readonly heelRestColour = signal<string | null>(null);
  /** Rubber colour choices for the step-09 picker. */
  protected readonly rubberColours = HEEL_REST_RUBBER_COLOURS;

  /** Texture ids whose thumbnail photo failed to load → render the placeholder. */
  protected readonly textureFailed = signal<ReadonlySet<string>>(new Set());
  protected onTextureError(texture: string): void {
    this.textureFailed.update(failed => new Set(failed).add(texture));
  }

  // --- dialogs / flow --------------------------------------------------------
  protected readonly materialInfoOpen = signal(false);
  // Per-step explanation dialogs (opened from the ℹ️ icon next to each title).
  protected readonly textureInfoOpen = signal(false);
  protected readonly mountingInfoOpen = signal(false);
  protected readonly heelRestInfoOpen = signal(false);
  protected readonly kitInfoOpen = signal(false);
  protected readonly accessoriesInfoOpen = signal(false);
  protected readonly heelInfoOpen = signal(false);
  protected readonly deliveryInfoOpen = signal(false);
  protected readonly authOpen = signal(false);
  protected readonly paymentOpen = signal(false);
  private readonly pendingAction = signal<'pay' | 'manager' | null>(null);
  /** Guards the checkout call so a double-click can't create a duplicate order. */
  protected readonly checkingOut = signal(false);
  /**
   * Add-to-cart is synchronous (a cart signal update), so a plain guard would
   * reset in the same tick — the minDurationMs floor debounces a rapid re-click.
   */
  protected readonly addToCartAction = createAsyncAction(
    () => {
      const pattern = this.activePattern();
      if (!pattern) return;
      const merged = this.cart.add(
        this.config.toCartItem(this.cartLineId(), pattern, this.state())
      );
      this.toast.success(merged ? 'cart_quantity_updated' : 'product_added_to_cart');
    },
    { minDurationMs: 500 }
  );

  // --- derived option lists --------------------------------------------------
  protected readonly brandOptions = computed<SelectOption[]>(() =>
    this.vehicles.brands().map(b => ({ value: b.id, label: b.name }))
  );
  protected readonly modelOptions = computed<SelectOption[]>(() => {
    const brandId = this.values().brandId ?? '';
    return brandId ? this.vehicles.modelsFor(brandId).map(m => ({ value: m, label: m })) : [];
  });
  protected readonly yearOptions = computed<SelectOption[]>(() => {
    const { brandId, model } = this.values();
    return brandId && model
      ? this.vehicles.yearOptionsFor(brandId, model).map(y => ({ value: y.label, label: y.label }))
      : [];
  });

  private readonly matchingPatterns = computed(() => {
    const { brandId, model, yearLabel } = this.values();
    return brandId && model && yearLabel
      ? this.vehicles.patternsFor(brandId, model, yearLabel)
      : [];
  });

  /** Resolved vehicle pattern (first match for the selection). */
  protected readonly activePattern = computed(() => this.matchingPatterns()[0] ?? null);

  /** Whether a vehicle is fully selected/resolved. */
  protected readonly vehicleResolved = computed(() => this.activePattern() !== null);

  /** Read-only vehicle summary line for step 01. */
  protected readonly vehicleInfo = computed(() => {
    const p = this.activePattern();
    if (!p) return null;
    const t = (k: string): string => this.translation.translate(k);
    const parts = [`${p.brandName} ${p.model}`];
    if (p.bodyType) parts.push(t(`body_type_${p.bodyType}`));
    if (p.yearLabel) parts.push(p.yearLabel);
    const head = parts.join(' ');
    return p.sku ? `${head} | ${p.sku}` : head;
  });

  /** Years of manufacture within the selected pattern's range. */
  protected readonly yearOfManufactureOptions = computed<SelectOption[]>(() => {
    const p = this.activePattern();
    if (!p?.yearFrom) return [];
    const to = p.yearTo ?? new Date().getFullYear();
    const out: SelectOption[] = [];
    for (let y = to; y >= p.yearFrom; y--) out.push({ value: String(y), label: String(y) });
    return out;
  });

  /** Whether the resolved pattern supports a heel pad at all (dataset `heel_pad`). */
  protected readonly heelPadSupported = computed(() => {
    const h = this.activePattern()?.heelPad;
    return h === 'standard' || h === '3d';
  });

  /**
   * Heel-pad options available for the resolved pattern, driven by its `heelPad`
   * field. Always includes `none`; order is fixed (Without → Standard → 3D).
   *   `none`/null → ['none']; `standard` → ['none','standard']; `3d` → all three.
   */
  protected readonly availableHeelPads = computed<readonly HeelPadAccessory[]>(() => {
    const h = this.activePattern()?.heelPad;
    if (h === '3d') return ['none', 'standard', '3d'];
    if (h === 'standard') return ['none', 'standard'];
    return ['none'];
  });

  /** Whether a specific heel-pad option is available for the resolved pattern. */
  protected isHeelPadAvailable(option: HeelPadAccessory): boolean {
    return this.availableHeelPads().includes(option);
  }

  /** Tooltip/disabled message key for an unavailable heel-pad option. */
  protected heelPadUnavailableKey(option: HeelPadAccessory): string {
    return option === '3d' ? 'heel_pad_3d_not_available' : 'heel_pad_not_available';
  }

  // --- pricing (reactive) ----------------------------------------------------
  protected readonly state = computed<ConfigState>(() => ({
    material: this.material(),
    texture: this.texture(),
    materialColor: this.materialColor(),
    edgeColor: this.edgeColor(),
    zones: this.zones(),
    accessories: this.accessories(),
    mounting: this.mounting(),
    heelPad: this.heelPad(),
    heelRest: this.heelRest(),
    heelRestColour: this.heelRestColour(),
    transmission: this.values().transmission || null,
    year: this.values().yearOfManufacture ? Number(this.values().yearOfManufacture) : null,
    drive: this.values().drive || null,
    engine: this.values().engine || null,
  }));
  protected readonly price = computed(() => this.config.price(this.state()));
  protected readonly shipping = computed(() => this.config.shipping(this.zones()));
  protected readonly total = computed(() => round2(this.price() + this.shipping()));

  /** Individual add-on prices, surfaced for the summary breakdown (step 13). */
  protected readonly heelPadPrice = computed(() => this.config.heelPadPrice(this.heelPad()));
  protected readonly heelRestPrice = computed(() => this.config.heelRestPrice(this.heelRest()));

  /** Heel-rest overlay image src for the mat preview (null → no overlay). */
  protected readonly heelRestOverlaySrc = computed(() =>
    this.config.heelRestOverlaySrc(this.heelRest(), this.heelRestColour())
  );
  /** i18n label key for the selected rubber colour (null unless Rubber). */
  protected readonly heelRestColourKey = computed(() =>
    this.config.heelRestColourLabelKey(this.heelRestColour())
  );

  /** Free shipping applies (full interior / premium set). */
  protected readonly freeShipping = computed(() => this.shipping() === 0 && this.zones().size > 0);

  /** Preview caption, e.g. "EVA · Raute". */
  protected readonly caption = computed(
    () =>
      `${this.translation.translate(`configurator_material_${this.material()}`)} · ${this.translation.translate(`configurator_texture_${this.texture()}`)}`
  );

  /** Colour hex helpers for the preview. */
  protected readonly materialHex = computed(
    () => this.availableMatColours().find(c => c.id === this.materialColor())?.hex ?? '#1a1a1a'
  );
  protected readonly edgeHex = computed(
    () => this.edgeColours().find(c => c.id === this.edgeColor())?.hex ?? '#1a1a1a'
  );

  /** Selected colour names in the active language, for the step-13 summary. */
  protected readonly materialColourName = computed(() =>
    this.config.matColourName(this.materialColor(), this.translation.currentLanguage())
  );
  protected readonly edgeColourName = computed(() =>
    this.config.edgeColourName(this.edgeColor(), this.translation.currentLanguage())
  );

  /** Vehicle line for the summary, e.g. "Acura MDX 2014–2020" (null if unresolved). */
  protected readonly vehicleSummary = computed(() => {
    const p = this.activePattern();
    if (!p) return null;
    return p.yearLabel ? `${p.brandName} ${p.model} ${p.yearLabel}` : `${p.brandName} ${p.model}`;
  });

  /** Full configuration view-model for the shared step-13 summary list. */
  protected readonly configDetails = computed<ConfigDetailsVM>(() => {
    const zones = this.zones();
    const ship = this.shipping();
    return {
      vehicle: this.vehicleSummary(),
      transmission: this.values().transmission || null,
      year: this.values().yearOfManufacture ? Number(this.values().yearOfManufacture) : null,
      drive: this.values().drive || null,
      engine: this.values().engine || null,
      material: this.material(),
      texture: this.texture(),
      materialColour: this.materialColourName(),
      materialColourHex: this.materialHex(),
      edgeColour: this.edgeColourName(),
      edgeColourHex: this.edgeHex(),
      mounting: this.mounting(),
      heelPad: this.heelPad(),
      heelPadPrice: this.heelPadPrice(),
      heelRest: this.heelRest(),
      heelRestColour: this.heelRestColourKey(),
      heelRestPrice: this.heelRestPrice(),
      accessories: this.accessories(),
      positions: CAR_ZONES.filter(z => zones.has(z)),
      deliveryTierKey: zones.size > 0 ? this.config.deliveryTierKey(zones) : null,
      deliveryCost: ship === 0 ? null : ship,
    };
  });

  /** Colour display name in the active language (DE → name_de, else name_en). */
  protected colourName(colour: MatColour): string {
    return this.translation.currentLanguage() === 'de' ? colour.name_de : colour.name_en;
  }

  /**
   * Very light/near-white swatches need a faint border so they read as a circle on
   * the white surface. True when perceived luminance (Rec. 601, normalized 0–1)
   * exceeds 0.85 — i.e. white, cream, light grey.
   */
  protected needsBorder(hex: string): boolean {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.85;
  }

  protected readonly canCheckout = computed(() => this.vehicleResolved() && this.zones().size > 0);

  // --- step tracking (drives left-column prominence) -------------------------
  /** The 13 step cards (DOM order = step number); see IntersectionObserver below. */
  private readonly stepCards = viewChildren<ElementRef<HTMLElement>>('stepCard');
  /** Step currently in the viewport's active band (1–13). */
  protected readonly activeStep = signal(1);

  /** The Summary card (step 13); observed directly to toggle the sticky bar. */
  private readonly summaryCard = viewChild<ElementRef<HTMLElement>>('summaryCard');
  /** True once the Summary card enters the viewport (≥10% visible). */
  protected readonly summaryVisible = signal(false);

  /**
   * Mobile sticky bottom bar visibility. Hidden once the Summary card is in view —
   * its own card already carries the full total + "Add to cart" / "Pay now" CTAs,
   * so the bar would be redundant there. Reappears when scrolled back up.
   */
  protected readonly showStickyBar = computed(() => !this.summaryVisible());

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Watch the step cards; the one in the active band (≈20–40% down the
    // viewport) sets activeStep, switching the left column between
    // mat-preview (steps 1–9) and car-diagram (steps 10–12, i.e. Build your set
    // onward) on desktop.
    effect(onCleanup => {
      const cards = this.stepCards();
      if (!cards.length || typeof IntersectionObserver === 'undefined') return;
      // Track which step cards currently overlap the active band; the
      // furthest-scrolled one (highest index) is the active step. threshold:0
      // fires on enter/exit so tall cards — which never reach a high intersection
      // ratio inside the thin −20%/−60% band — are still detected (a single 0.3
      // threshold missed them entirely, freezing activeStep at 1).
      const inBand = new Set<number>();
      const observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const index = cards.findIndex(c => c.nativeElement === entry.target);
            if (index < 0) continue;
            if (entry.isIntersecting) inBand.add(index);
            else inBand.delete(index);
          }
          if (inBand.size) this.activeStep.set(Math.max(...inBand) + 1);
        },
        { threshold: 0, rootMargin: '-20% 0px -60% 0px' }
      );
      cards.forEach(c => observer.observe(c.nativeElement));
      onCleanup(() => observer.disconnect());
    });

    // Toggle the mobile sticky bar by observing the Summary card directly (rather
    // than the activeStep band) so it hides exactly when Summary scrolls into view.
    effect(onCleanup => {
      const card = this.summaryCard();
      if (!card || typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        ([entry]) => this.summaryVisible.set(entry.isIntersecting),
        { threshold: 0.1 }
      );
      observer.observe(card.nativeElement);
      onCleanup(() => observer.disconnect());
    });

    // Reset downstream selections when an upstream one changes.
    this.form.controls.brandId.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.form.patchValue({ model: '', yearLabel: '' }));
    this.form.controls.model.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.form.patchValue({ yearLabel: '' }));

    // Pre-fill brand from the route once brands load.
    effect(() => {
      const routeBrand = this.brand();
      const brands = this.vehicles.brands();
      if (!routeBrand || !brands.some(b => b.id === routeBrand)) return;
      if (untracked(() => this.form.controls.brandId.value) !== routeBrand) {
        this.form.controls.brandId.setValue(routeBrand);
      }
    });

    // Auto-select the year range when exactly one (or the first of several).
    effect(() => {
      const options = this.yearOptions();
      const current = untracked(() => this.form.controls.yearLabel.value);
      if (options.length > 0 && !options.some(o => o.value === current)) {
        this.form.controls.yearLabel.setValue(options[0].value);
      }
    });

    // Year-of-manufacture (step 02) is gated on the resolved pattern's year range:
    // enable the dropdown only when that range exists, else clear + disable it.
    effect(() => {
      const hasRange = this.yearOfManufactureOptions().length > 0;
      const control = this.form.controls.yearOfManufacture;
      if (hasRange) {
        if (control.disabled) control.enable();
      } else if (control.enabled) {
        control.reset('');
        control.disable();
      }
    });

    // Keep the chosen mat colour valid for the current texture/size. When the
    // texture changes (step 04) its colour set changes too — if the selected
    // colour isn't offered, reset to black (always available) or the first option.
    effect(() => {
      const available = this.availableMatColours();
      if (available.length && !available.some(c => c.id === untracked(this.materialColor))) {
        const fallback = available.find(c => c.id === 'black') ?? available[0];
        this.materialColor.set(fallback.id);
      }
    });
    effect(() => {
      const palette = this.edgeColours();
      if (palette.length && !palette.some(c => c.id === untracked(this.edgeColor))) {
        this.edgeColor.set(palette[0].id);
      }
    });

    // Reset the heel-pad choice to "none" whenever the current one isn't
    // available for the newly-resolved pattern (default is always "Without").
    effect(() => {
      if (!this.isHeelPadAvailable(untracked(this.heelPad))) {
        this.heelPad.set('none');
      }
    });
  }

  // --- selection handlers ----------------------------------------------------
  protected selectMaterial(value: MaterialType): void {
    if (value === 'eva') this.material.set(value); // ecoskin is coming soon (disabled)
  }
  protected selectTexture(value: Texture): void {
    this.texture.set(value);
  }
  protected selectMaterialColor(id: string): void {
    this.materialColor.set(id);
  }
  protected selectEdgeColor(id: string): void {
    this.edgeColor.set(id);
  }
  protected setAccessories(value: Accessories): void {
    this.accessories.set(value);
  }
  protected setMounting(value: Mounting): void {
    // 3D mount is Coming Soon (disabled in the UI); only `none` is selectable.
    if (value === 'none') this.mounting.set(value);
  }
  protected setHeelPad(value: HeelPadAccessory): void {
    if (this.isHeelPadAvailable(value)) this.heelPad.set(value);
  }
  protected setHeelRest(value: HeelRest): void {
    this.heelRest.set(value);
    // Rubber needs a colour (default to the first); clear it for metal/none so
    // switching away never leaves a stale colour in the state or overlay.
    this.heelRestColour.set(value === 'rubber' ? this.config.defaultHeelRestColour : null);
  }
  protected setHeelRestColour(id: string): void {
    this.heelRestColour.set(id);
  }

  protected isZone(zone: CarZone): boolean {
    return this.zones().has(zone);
  }
  protected toggleZone(zone: CarZone): void {
    const next = new Set(this.zones());
    if (next.has(zone)) next.delete(zone);
    else next.add(zone);
    this.zones.set(next);
  }
  protected applyPreset(preset: KitPreset): void {
    this.zones.set(new Set(this.config.presetZones(preset)));
  }

  protected openMaterialInfo(): void {
    this.materialInfoOpen.set(true);
  }

  // --- checkout flow ---------------------------------------------------------
  protected addToCart(): void {
    if (!this.activePattern()) {
      this.toast.error('configurator_select_vehicle_first');
      return;
    }
    void this.addToCartAction.execute();
  }

  protected payNow(): void {
    if (!this.requireVehicle()) return;
    if (!this.isAuthenticated()) {
      this.pendingAction.set('pay');
      this.authOpen.set(true);
      return;
    }
    this.paymentOpen.set(true);
  }

  protected contactManager(): void {
    if (!this.requireVehicle()) return;
    if (!this.isAuthenticated()) {
      this.pendingAction.set('manager');
      this.authOpen.set(true);
      return;
    }
    void this.runCheckout('contact_manager');
  }

  /** Replays the pending CTA after a successful login/registration. */
  protected onAuthenticated(): void {
    const pending = this.pendingAction();
    this.pendingAction.set(null);
    if (pending === 'pay') this.paymentOpen.set(true);
    else if (pending === 'manager') void this.runCheckout('contact_manager');
  }

  protected onPaymentSelected(method: PaymentMethod): void {
    void this.runCheckout(method);
  }

  private async runCheckout(method: PaymentMethod): Promise<void> {
    const pattern = this.activePattern();
    if (!pattern) return;
    if (this.checkingOut()) return; // double-click / re-entry guard
    this.checkingOut.set(true);
    try {
      await this.checkout.complete({
        items: [this.config.toOrderItem(pattern, this.state())],
        subtotal: this.price(),
        shipping: this.shipping(),
        method,
        clearCart: false,
      });
    } finally {
      this.checkingOut.set(false);
    }
  }

  private requireVehicle(): boolean {
    if (!this.vehicleResolved()) {
      this.toast.error('configurator_select_vehicle_first');
      return false;
    }
    return true;
  }

  private cartLineId(): string {
    return `cfg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
