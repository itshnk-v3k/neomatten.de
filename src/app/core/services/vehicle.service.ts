/*
 * EN: Vehicle / mat-pattern data service. Loads the normalized flat mock JSON
 *     (vehicle-patterns.json + brands.json) once and exposes it as signals, plus
 *     pure helpers that derive the configurator hierarchy (brand → model → year
 *     range → pattern) and catalog filters in memory. The mock-vs-API URL is the
 *     only thing that changes when the real .NET/Postgres backend lands.
 * RU: Сервис данных авто / лекал. Один раз грузит нормализованный плоский mock
 *     JSON и отдаёт его сигналами, плюс чистые хелперы, выводящие иерархию
 *     конфигуратора (марка → модель → диапазон годов → лекало) и фильтры
 *     каталога в памяти. При переходе на реальный бэкенд меняется только URL.
 */
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Brand, HeelPad, VehiclePattern } from '@core/models/vehicle.model';
import { environment } from '@env/environment';

/** A selectable year range for a (brand, model) pair. */
export interface YearOption {
  readonly label: string;
  readonly from: number | null;
  readonly to: number | null;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);

  /**
   * All normalized patterns (empty until the mock JSON resolves).
   * TODO(backend): served from `GET /api/vehicles/vehicle-patterns` (drop the mock flag).
   */
  readonly patterns = toSignal(this.http.get<VehiclePattern[]>(this.url('vehicle-patterns')), {
    initialValue: [] as VehiclePattern[],
  });

  /**
   * Brand index (sorted by display name).
   * TODO(backend): served from `GET /api/vehicles/brands` (drop the mock flag).
   */
  readonly brands = toSignal(this.http.get<Brand[]>(this.url('brands')), {
    initialValue: [] as Brand[],
  });

  /** True once the patterns have loaded. */
  readonly loaded = computed(() => this.patterns().length > 0);

  private readonly loadingSignal = signal(true);
  /** True while the initial (mock) data loads; flips false after a short delay. */
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    // Mock loading delay so skeleton states are visible during development.
    // TODO(backend): drive `loading` from the real request lifecycle instead.
    setTimeout(() => this.loadingSignal.set(false), 600);
  }

  /** TODO(backend): mock-vs-API URL switch — the only swap point for real data. */
  private url(resource: 'vehicle-patterns' | 'brands'): string {
    return environment.features.useMockData
      ? `/assets/mock-data/${resource}.json`
      : `/api/vehicles/${resource}`;
  }

  /** Distinct models for a brand, sorted alphabetically. */
  modelsFor(brandId: string): string[] {
    const models = new Set<string>();
    for (const p of this.patterns()) {
      if (p.brandId === brandId) models.add(p.model);
    }
    return [...models].sort((a, b) => a.localeCompare(b));
  }

  /** Distinct year ranges for a (brand, model), most recent first. */
  yearOptionsFor(brandId: string, model: string): YearOption[] {
    const byLabel = new Map<string, YearOption>();
    for (const p of this.patterns()) {
      if (p.brandId === brandId && p.model === model && p.yearLabel) {
        byLabel.set(p.yearLabel, { label: p.yearLabel, from: p.yearFrom, to: p.yearTo });
      }
    }
    return [...byLabel.values()].sort((a, b) => (b.from ?? 0) - (a.from ?? 0));
  }

  /** Patterns matching a fully-chosen (brand, model, year range). */
  patternsFor(brandId: string, model: string, yearLabel: string): VehiclePattern[] {
    return this.patterns().filter(
      p => p.brandId === brandId && p.model === model && p.yearLabel === yearLabel
    );
  }

  /** Distinct heel-pad variants available among the given patterns, in UI order. */
  heelPadsOf(patterns: readonly VehiclePattern[]): HeelPad[] {
    const order: HeelPad[] = ['standard', '3d', 'none'];
    const present = new Set(patterns.map(p => p.heelPad).filter((h): h is HeelPad => h != null));
    return order.filter(h => present.has(h));
  }

  /** A single brand by id. */
  brand(brandId: string): Brand | undefined {
    return this.brands().find(b => b.id === brandId);
  }
}
