/*
 * Admin translations data service. Wraps the NestJS admin endpoints under
 * /api/admin/translations (auth + admin token attached by the interceptors).
 */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

/** One editable copy string, per key + locale (mirrors the backend row). */
export interface TranslationRow {
  readonly id: string;
  readonly key: string;
  readonly locale: 'de' | 'en';
  readonly category: string | null;
  readonly value: string;
  readonly draftValue: string | null;
  readonly updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationsAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin/translations`;

  /** Full editable list, ordered by category → key → locale. */
  list(): Promise<TranslationRow[]> {
    return firstValueFrom(this.http.get<TranslationRow[]>(this.base));
  }

  /** Stage a pending edit (only draftValue changes). */
  updateDraft(id: string, draftValue: string): Promise<TranslationRow> {
    return firstValueFrom(this.http.patch<TranslationRow>(`${this.base}/${id}`, { draftValue }));
  }

  /** Publish every pending draft live. Returns the number of rows published. */
  publish(): Promise<{ published: number }> {
    return firstValueFrom(this.http.post<{ published: number }>(`${this.base}/publish`, {}));
  }

  /** Count of rows with a pending, unpublished draft. */
  pendingCount(): Promise<{ count: number }> {
    return firstValueFrom(this.http.get<{ count: number }>(`${this.base}/pending-count`));
  }
}
