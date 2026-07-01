import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { randomBytes } from 'crypto';

/**
 * Short-lived, single-use exchange codes for the OAuth token handoff.
 *
 * On a successful OAuth callback we do NOT redirect with JWTs in the URL (they
 * would leak via browser history / referrer / server logs). Instead we mint an
 * opaque code that maps to the freshly issued auth payload, redirect the browser
 * with only that code, and let the frontend swap it for the real tokens via
 * POST /auth/exchange. The code is deleted on first read (single-use) and
 * expires after 60s.
 *
 * An in-memory Map is sufficient at this scale (single API instance, low OAuth
 * volume). If the API is ever horizontally scaled, back this with Redis or a
 * short-lived DB table instead.
 */
@Injectable()
export class OAuthCodeStore<T = unknown> implements OnModuleDestroy {
  private readonly ttlMs = 60_000;
  private readonly store = new Map<string, { value: T; expiresAt: number }>();
  private readonly sweeper: ReturnType<typeof setInterval>;

  constructor() {
    // Drop expired entries periodically so the map can't grow unbounded from
    // codes that are never redeemed. `unref` keeps this from holding the process open.
    this.sweeper = setInterval(() => this.sweep(), this.ttlMs);
    this.sweeper.unref?.();
  }

  /** Store a value behind a fresh opaque code and return the code. */
  issue(value: T): string {
    const code = randomBytes(32).toString('base64url');
    this.store.set(code, { value, expiresAt: Date.now() + this.ttlMs });
    return code;
  }

  /** Return the value for a code and invalidate it (single use); null if invalid/expired. */
  consume(code: string): T | null {
    const entry = this.store.get(code);
    if (!entry) {
      return null;
    }
    this.store.delete(code);
    if (entry.expiresAt < Date.now()) {
      return null;
    }
    return entry.value;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [code, entry] of this.store) {
      if (entry.expiresAt < now) {
        this.store.delete(code);
      }
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper);
  }
}
