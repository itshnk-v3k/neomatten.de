/*
 * Products admin (Товары) — V1 CRUD over the flat Prisma Product model
 * (nameDE, nameEN, slug, type, basePrice, isActive). List + search + type
 * filter + inline active toggle, with a modal reactive form for create/edit and
 * a confirm dialog for delete. UI chrome text comes from AdminI18nService;
 * money values are backend-owned (`basePrice`) and formatted for display only.
 *
 * Out of scope (deferred): images/media (blocked on the future media task),
 * description/specs/stock/subcategory columns, and the public-catalog migration.
 */
import { HttpErrorResponse } from '@angular/common/http';
import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideLoaderCircle,
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideTrash2,
  LucideWandSparkles,
  LucideX,
} from '@lucide/angular';
import { toast } from 'ngx-sonner';

import { AdminI18nService } from '../../core/i18n/admin-i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import type { AdminProduct } from './products.service';
import { PRODUCT_TYPES, ProductsAdminService } from './products.service';

/** Slug convention shared with the backend DTO (kebab-case). */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Maps a `type` value to its translatable label key. */
const TYPE_LABEL_KEY: Record<string, string> = {
  mats: 'products.typeMats',
  cushion: 'products.typeCushion',
  eva_bag: 'products.typeEvaBag',
  leather_bag: 'products.typeLeatherBag',
};

@Component({
  selector: 'na-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    LucidePlus,
    LucideSearch,
    LucidePencil,
    LucideTrash2,
    LucideX,
    LucideLoaderCircle,
    LucideWandSparkles,
  ],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
  private readonly service = inject(ProductsAdminService);
  private readonly fb = inject(NonNullableFormBuilder);
  /** Exposed to the template for pluralized count lookups (tp). */
  protected readonly i18n = inject(AdminI18nService);

  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly typeFilter = signal<string>('all');

  /** The product being edited, the 'new' sentinel (create), or null (closed). */
  protected readonly editing = signal<AdminProduct | 'new' | null>(null);
  protected readonly submitting = signal(false);
  /** Inline slug error (e.g. 409 collision), shown under the slug field. */
  protected readonly slugError = signal<string | null>(null);

  /** Product pending deletion (confirm dialog), or null. */
  protected readonly deleting = signal<AdminProduct | null>(null);
  protected readonly removingActive = signal(false);
  /** Ids with an in-flight active-toggle PATCH (disables that row's toggle). */
  private readonly togglingIds = signal<ReadonlySet<string>>(new Set());

  protected readonly types = PRODUCT_TYPES;

  private readonly priceFormatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });

  protected readonly form = this.fb.group({
    nameDE: ['', [Validators.required]],
    nameEN: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(SLUG_PATTERN)]],
    type: ['mats', [Validators.required]],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  /** Search + type filtered view (client-side; volume is a few dozen). */
  protected readonly filtered = computed<AdminProduct[]>(() => {
    const term = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    return this.products().filter(
      p =>
        (type === 'all' || p.type === type) &&
        (term === '' ||
          p.nameDE.toLowerCase().includes(term) ||
          p.nameEN.toLowerCase().includes(term) ||
          p.slug.toLowerCase().includes(term))
    );
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.products.set(await this.service.list());
    } catch {
      toast.error(this.i18n.t('products.loadError'));
    } finally {
      this.loading.set(false);
    }
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onFilter(event: Event): void {
    this.typeFilter.set((event.target as HTMLSelectElement).value);
  }

  /** Localized label for a product type value. */
  protected typeLabel(type: string): string {
    return this.i18n.t(TYPE_LABEL_KEY[type] ?? type);
  }

  /** EUR-formatted base price (backend-owned value, display only). */
  protected formatPrice(value: string | number): string {
    return this.priceFormatter.format(Number(value));
  }

  protected isToggling(id: string): boolean {
    return this.togglingIds().has(id);
  }

  // --- Create / edit ---------------------------------------------------------

  protected openCreate(): void {
    this.slugError.set(null);
    this.form.reset({
      nameDE: '',
      nameEN: '',
      slug: '',
      type: 'mats',
      basePrice: 0,
      isActive: true,
    });
    this.editing.set('new');
  }

  protected openEdit(product: AdminProduct): void {
    this.slugError.set(null);
    this.form.reset({
      nameDE: product.nameDE,
      nameEN: product.nameEN,
      slug: product.slug,
      type: product.type,
      basePrice: Number(product.basePrice),
      isActive: product.isActive,
    });
    this.editing.set(product);
  }

  protected closeForm(): void {
    this.editing.set(null);
  }

  protected isEditTitle(): boolean {
    return this.editing() !== 'new';
  }

  /** Derive a kebab-case slug from the German name (still manually editable). */
  protected generateSlug(): void {
    const slug = this.form.controls.nameDE.value
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.form.controls.slug.setValue(slug);
    this.form.controls.slug.markAsTouched();
  }

  protected async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.slugError.set(null);
    const value = this.form.getRawValue();

    try {
      const target = this.editing();
      if (target === 'new') {
        await this.service.create(value);
        toast.success(this.i18n.t('products.created'));
      } else if (target) {
        await this.service.update(target.id, value);
        toast.success(this.i18n.t('products.updated'));
      }
      await this.reload();
      this.editing.set(null);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.slugError.set(this.i18n.t('products.errSlugTaken'));
      } else {
        toast.error(this.i18n.t('products.saveError'));
      }
    } finally {
      this.submitting.set(false);
    }
  }

  // --- Active toggle ---------------------------------------------------------

  protected async toggleActive(product: AdminProduct): Promise<void> {
    if (this.isToggling(product.id)) {
      return;
    }
    this.mutateToggling(s => s.add(product.id));
    try {
      const updated = await this.service.update(product.id, { isActive: !product.isActive });
      this.products.update(list => list.map(p => (p.id === updated.id ? updated : p)));
    } catch {
      toast.error(this.i18n.t('products.saveError'));
    } finally {
      this.mutateToggling(s => s.delete(product.id));
    }
  }

  // --- Delete ----------------------------------------------------------------

  protected openDelete(product: AdminProduct): void {
    this.deleting.set(product);
  }

  protected closeDelete(): void {
    this.deleting.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const product = this.deleting();
    if (!product || this.removingActive()) {
      return;
    }
    this.removingActive.set(true);
    try {
      await this.service.remove(product.id);
      this.products.update(list => list.filter(p => p.id !== product.id));
      toast.success(this.i18n.t('products.deleted'));
      this.deleting.set(null);
    } catch (error) {
      // Surface a specific backend message (e.g. a future FK block) when present.
      const message =
        error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
          ? error.error.message
          : this.i18n.t('products.deleteError');
      toast.error(message);
    } finally {
      this.removingActive.set(false);
    }
  }

  /** Immutable update of the toggling-ids Set (keeps OnPush honest). */
  private mutateToggling(apply: (s: Set<string>) => void): void {
    const next = new Set(this.togglingIds());
    apply(next);
    this.togglingIds.set(next);
  }
}
