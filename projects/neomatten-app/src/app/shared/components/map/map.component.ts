/*
 * EN: Leaflet map. A lightweight wrapper that renders an OpenStreetMap tile map
 *     centred on the given coordinates with a brand-coloured marker. Initialized
 *     after render (browser only) and destroyed on teardown. Uses a circle
 *     marker so there are no bundler image-asset issues with the default icon.
 * RU: Карта Leaflet. Лёгкая обёртка, рисующая карту тайлов OpenStreetMap с
 *     центром по заданным координатам и маркером в цвете бренда.
 *     Инициализируется после рендера (только в браузере) и уничтожается при
 *     удалении. Использует кольцевой маркер — без проблем с дефолтной иконкой.
 */
import type { ElementRef, OnDestroy } from '@angular/core';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  input,
  viewChild,
} from '@angular/core';
import type * as Leaflet from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';

@Component({
  selector: 'nm-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #host
      class="h-full min-h-72 w-full rounded-xl"
      role="img"
      [attr.aria-label]="ariaLabel()"></div>
  `,
})
export class MapComponent implements OnDestroy {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly zoom = input<number>(14);
  /** Accessible description of the map (already-translated string). */
  readonly ariaLabel = input<string>('Map');

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private map?: LeafletMap;

  constructor() {
    afterNextRender(async () => {
      // Dynamic import keeps Leaflet out of the initial bundle and off the server.
      // Leaflet ships as UMD/CommonJS; under esbuild the API can land on `.default`
      // rather than as named exports, which surfaces as "L.map is not a function".
      // Unwrap the interop default so the call works in both shapes.
      const leafletModule = (await import('leaflet')) as unknown as {
        default?: typeof Leaflet;
      } & typeof Leaflet;
      const L = leafletModule.default ?? leafletModule;
      const center: [number, number] = [this.lat(), this.lng()];
      this.map = L.map(this.host().nativeElement, {
        center,
        zoom: this.zoom(),
        scrollWheelZoom: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);
      L.circleMarker(center, {
        radius: 10,
        color: '#8B1A1A',
        fillColor: '#8B1A1A',
        fillOpacity: 0.85,
        weight: 3,
      }).addTo(this.map);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
