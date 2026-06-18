/*
 * EN: Account dashboard (protected by authGuard). Greets the user, lists their
 *     order history from OrderService with a status badge per order
 *     (Pending / Pending contact / In production / Shipped / Delivered) and shows
 *     the profile (name, email, phone, address) with edit / change-password /
 *     delete-account actions and a logout action. Delete is confirmed via a dialog.
 * RU: Панель аккаунта (под authGuard). Приветствует пользователя, показывает
 *     историю заказов из OrderService с бейджем статуса на заказ
 *     (Ожидает / Ожидает контакта / В производстве / Отправлен / Доставлен) и
 *     профиль (имя, e-mail, телефон, адрес) с действиями редактирования /
 *     смены пароля / удаления аккаунта и выходом. Удаление — через диалог.
 */
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslationService } from '@core/i18n/translation.service';
import type {
  OrderItemDTO,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  ProductCategory,
} from '@core/models/order.model';
import { AuthService } from '@core/services/auth.service';
import { OrderService } from '@core/services/order.service';
import { ProductService } from '@core/services/product.service';
import { ConfiguratorService } from '@features/configurator/configurator.service';
import {
  LucideCheck,
  LucideChevronDown,
  LucideCopy,
  LucideSearchX,
  LucideSlidersHorizontal,
  LucideStore,
} from '@lucide/angular';
import { BrandIconComponent } from '@shared/components/brand-icon/brand-icon.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import {
  type DateRange,
  DateRangePickerComponent,
} from '@shared/components/date-range-picker/date-range-picker.component';
import { SelectComponent } from '@shared/components/select/select.component';
import { SheetComponent } from '@shared/components/sheet/sheet.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import type { SelectOption } from '@shared/models/select-option.model';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ClipboardService } from '@shared/services/clipboard.service';
import { categoryBadge } from '@shared/utils/product-category';
// Per-icon, tree-shakeable named imports from simple-icons (CC0 brand marks).
import { siKlarna, siPaypal, siStripe } from 'simple-icons';

/** Filter value = a concrete status/category or the "all" sentinel. */
type StatusFilter = OrderStatus | 'all';
type CategoryFilter = ProductCategory | 'all';
type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low';

/** A run of consecutive orders sharing a month/year (newest/oldest sort only). */
interface OrderGroup {
  readonly key: string;
  readonly label: string;
  readonly orders: OrderRecord[];
}

const ORDER_STATUSES: readonly OrderStatus[] = [
  'review',
  'pending',
  'in_production',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
];

const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'mats',
  'eva_bag',
  'cushion',
  'leather_bag',
];

const SORT_OPTIONS: readonly SortOption[] = ['newest', 'oldest', 'price_high', 'price_low'];

@Component({
  selector: 'nm-account-page',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    ReactiveFormsModule,
    ButtonDirective,
    DateRangePickerComponent,
    SelectComponent,
    SheetComponent,
    SkeletonComponent,
    TranslatePipe,
    EuroPipe,
    BrandIconComponent,
    LucideStore,
    LucideCopy,
    LucideCheck,
    LucideChevronDown,
    LucideSlidersHorizontal,
    LucideSearchX,
  ],
  // Fill the account content column so the orders sidebar + list span its width.
  host: { '[style.display]': '"flex"', '[style.width]': '"100%"' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  /** Category chip preset (label key + classes) for an order item's category. */
  protected readonly categoryBadge = categoryBadge;
  /** Payment brand marks for the order's payment-method line (simple-icons). */
  protected readonly stripeIcon = siStripe;
  protected readonly klarnaIcon = siKlarna;
  protected readonly paypalIcon = siPaypal;
  /** Shared copy-to-clipboard helper (order ID + line SKU copy buttons). */
  protected readonly clipboard = inject(ClipboardService);

  private readonly auth = inject(AuthService);
  private readonly config = inject(ConfiguratorService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly orders = inject(OrderService);
  private readonly products = inject(ProductService);

  /**
   * Catalogue description for a simple (non-configured) product line, resolved by
   * SKU from products.json and translated. Returns null when the product or its
   * description i18n key can't be resolved (so nothing renders).
   */
  protected productDescription(item: OrderItemDTO): string | null {
    if (!item.sku) return null;
    const product = this.products.products().find(p => p.sku === item.sku);
    if (!product?.description) return null;
    const text = this.translation.translate(product.description);
    return text === product.description ? null : text;
  }

  protected readonly user = this.auth.user;
  protected readonly orderList = this.orders.orders;

  // --- Filters / sort -------------------------------------------------------
  // Backed by Reactive Forms so the shared nm-select (a ControlValueAccessor)
  // can drive them; mirrored into signals for the computed pipeline below.
  protected readonly statusControl = new FormControl<StatusFilter>('all', { nonNullable: true });
  protected readonly categoryControl = new FormControl<CategoryFilter>('all', {
    nonNullable: true,
  });
  protected readonly sortControl = new FormControl<SortOption>('newest', { nonNullable: true });

  private readonly status = toSignal(this.statusControl.valueChanges, {
    initialValue: this.statusControl.value,
  });
  private readonly category = toSignal(this.categoryControl.valueChanges, {
    initialValue: this.categoryControl.value,
  });
  private readonly sort = toSignal(this.sortControl.valueChanges, {
    initialValue: this.sortControl.value,
  });

  /** Selected order-date range (null = no date filter). */
  protected readonly dateRange = signal<DateRange | null>(null);

  /** Whether the mobile "Filter & Sort" bottom sheet is open. */
  protected readonly filtersOpen = signal(false);

  /** Site-header height (px) — the sticky filters bar offsets below it. */
  protected readonly headerHeight = 72;

  /** The sticky filters bar; its measured height offsets the date group headers below it. */
  private readonly filtersBar = viewChild<ElementRef<HTMLElement>>('filtersBar');
  /** Measured filters-bar height (px) so date headers stick directly beneath it. */
  protected readonly filtersBarHeight = signal(0);

  /** First date-group header; its height pushes the desktop filters sidebar down. */
  private readonly dateHeader = viewChild<ElementRef<HTMLElement>>('dateHeader');
  /** Measured date-header height (px); 0 when none is rendered (ungrouped/empty). */
  protected readonly dateHeaderHeight = signal(0);

  /**
   * lg breakpoint gate: at lg+ the filters render as an inline row, below it
   * they move into the bottom sheet. Rendering one branch at a time keeps a
   * single nm-select instance per control (a control binds one CVA at a time).
   */
  protected readonly isDesktop = signal(true);

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(min-width: 1024px)');
      this.isDesktop.set(mq.matches);
      const onChange = (e: MediaQueryListEvent): void => {
        this.isDesktop.set(e.matches);
        // The mobile sheet has no trigger on desktop; close it on the way up.
        if (e.matches) {
          this.filtersOpen.set(false);
        }
      };
      mq.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mq.removeEventListener('change', onChange));
    }

    // Keep the date-group headers stacked directly below the (variable-height,
    // breakpoint-dependent) sticky filters bar by measuring it live.
    let observer: ResizeObserver | undefined;
    effect(() => {
      const el = this.filtersBar()?.nativeElement;
      observer?.disconnect();
      if (!el || typeof ResizeObserver === 'undefined') {
        this.filtersBarHeight.set(0);
        return;
      }
      observer = new ResizeObserver(() => this.filtersBarHeight.set(el.offsetHeight));
      observer.observe(el);
    });
    this.destroyRef.onDestroy(() => observer?.disconnect());

    // On desktop the full-width date header sits above the filters sidebar; its
    // measured height both offsets the sidebar's sticky top and pushes its
    // initial position below the first header (no overlap of the breakout band).
    let headerObserver: ResizeObserver | undefined;
    effect(() => {
      const el = this.dateHeader()?.nativeElement;
      headerObserver?.disconnect();
      if (!el || typeof ResizeObserver === 'undefined') {
        this.dateHeaderHeight.set(0);
        return;
      }
      headerObserver = new ResizeObserver(() => this.dateHeaderHeight.set(el.offsetHeight));
      headerObserver.observe(el);
    });
    this.destroyRef.onDestroy(() => headerObserver?.disconnect());
  }

  /** Select options (labels re-resolve on language change). */
  protected readonly statusOptions = computed<SelectOption[]>(() => {
    this.translation.currentLanguage();
    return [
      { value: 'all', label: this.translation.translate('account_filter_all') },
      ...ORDER_STATUSES.map(s => ({
        value: s,
        label: this.translation.translate(`order_status_${s}`),
      })),
    ];
  });

  protected readonly categoryOptions = computed<SelectOption[]>(() => {
    this.translation.currentLanguage();
    return [
      { value: 'all', label: this.translation.translate('account_filter_all') },
      ...PRODUCT_CATEGORIES.map(c => ({
        value: c,
        label: this.translation.translate(`order_category_${c}`),
      })),
    ];
  });

  protected readonly sortOptions = computed<SelectOption[]>(() => {
    this.translation.currentLanguage();
    return SORT_OPTIONS.map(s => ({
      value: s,
      label: this.translation.translate(`account_sort_${s}`),
    }));
  });

  /** Orders passing the active status/category filters, sorted by the chosen key. */
  protected readonly filteredOrders = computed<OrderRecord[]>(() => {
    const status = this.status();
    const category = this.category();
    const sort = this.sort();
    const range = this.dateRange();
    const matched = this.orderList().filter(
      order =>
        (status === 'all' || order.status === status) &&
        (category === 'all' || order.items.some(item => item.category === category)) &&
        (range === null || this.withinRange(order.createdAt, range))
    );
    return matched.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.createdAt.localeCompare(b.createdAt);
        case 'price_high':
          return b.total - a.total;
        case 'price_low':
          return a.total - b.total;
        case 'newest':
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  });

  /** Grouping by month/year only applies to the chronological sorts. */
  protected readonly isGrouped = computed(
    () => this.sort() === 'newest' || this.sort() === 'oldest'
  );

  /** Filtered orders bucketed into consecutive month/year runs (localized labels). */
  protected readonly orderGroups = computed<OrderGroup[]>(() => {
    const lang = this.translation.currentLanguage();
    const formatter = new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
    const groups: OrderGroup[] = [];
    for (const order of this.filteredOrders()) {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const last = groups.at(-1);
      if (last && last.key === key) {
        last.orders.push(order);
      } else {
        groups.push({ key, label: formatter.format(date), orders: [order] });
      }
    }
    return groups;
  });

  /** Count of non-default filters (drives the mobile button badge). */
  protected readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.status() !== 'all') count++;
    if (this.category() !== 'all') count++;
    if (this.sort() !== 'newest') count++;
    if (this.dateRange() !== null) count++;
    return count;
  });

  /** Reset every filter/sort control to its default. */
  protected clearFilters(): void {
    this.statusControl.setValue('all');
    this.categoryControl.setValue('all');
    this.sortControl.setValue('newest');
    this.dateRange.set(null);
  }

  /** Whether an order's ISO `createdAt` falls within the inclusive date range. */
  private withinRange(createdAt: string, range: DateRange): boolean {
    const t = new Date(createdAt).getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  }

  // --- Expand / collapse ----------------------------------------------------
  /** Order ids whose full detail block is currently expanded. */
  private readonly expandedIds = signal(new Set<string>());

  protected isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  protected toggleExpanded(id: string): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /** Compact "2× BMW Mats, 1× Cushion" line for the collapsed card summary. */
  protected itemSummary(order: OrderRecord): string {
    return order.items.map(item => `${item.quantity}× ${item.name}`).join(', ');
  }

  /** Localized mat/edge colour names for a configured order line (falls back to the id). */
  protected matColourName(id: string): string {
    return this.config.matColourName(id, this.translation.currentLanguage());
  }
  protected edgeColourName(id: string): string {
    return this.config.edgeColourName(id, this.translation.currentLanguage());
  }
  /** Hex values for the mat/edge colour swatches (falls back to '' if unknown). */
  protected matColourHex(id: string): string {
    return this.config.matColourHex(id);
  }
  protected edgeColourHex(id: string): string {
    return this.config.edgeColourHex(id);
  }

  /** Badge colour classes per order status (matches the spec's status palette). */
  protected statusBadgeClasses(status: OrderStatus): string {
    switch (status) {
      case 'review':
        return 'bg-chrome-light text-ink';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'in_production':
        return 'bg-info/20 text-info';
      case 'shipped':
        return 'bg-primary/20 text-primary';
      case 'delivered':
        return 'bg-success/20 text-success';
      case 'completed':
        return 'bg-success text-white';
      case 'cancelled':
        return 'bg-error/20 text-error';
    }
  }

  /**
   * Total quantity across all line items in an order — the sum of each line's
   * `quantity`, NOT the number of line items. A single line with quantity 10 is
   * "10 items", not "1".
   */
  protected totalQuantity(order: OrderRecord): number {
    return order.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  }

  /** Translation key for an order's payment method label (icon picked in template). */
  protected paymentKey(method: PaymentMethod): string {
    switch (method) {
      case 'stripe_card':
        return 'order_payment_card';
      case 'klarna':
        return 'order_payment_klarna';
      case 'paypal':
        return 'order_payment_paypal';
      case 'contact_manager':
      default:
        return 'order_payment_pickup';
    }
  }
}
