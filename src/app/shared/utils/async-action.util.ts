/*
 * EN: Double-click / rapid-click protection primitive. Wraps an async (or
 *     synchronous) action behind a re-entrant guard exposed as a `pending`
 *     signal: while the action runs the guard blocks repeat invocations, and it
 *     is always released afterwards — even on error. Bind `pending()` to a
 *     button's [loading] (nm-button directive) to disable it and show a spinner.
 *     `minDurationMs` keeps `pending` true for a short floor so even instant
 *     (synchronous) actions debounce a frantic second click.
 * RU: Примитив защиты от двойного/частого клика. Оборачивает асинхронное (или
 *     синхронное) действие в повторно-входимый guard, отдаваемый сигналом
 *     `pending`: пока действие выполняется, guard блокирует повторные вызовы и
 *     всегда снимается после (даже при ошибке). Привяжите `pending()` к [loading]
 *     кнопки (директива nm-button), чтобы заблокировать её и показать спиннер.
 *     `minDurationMs` держит `pending` истинным минимальный интервал, чтобы даже
 *     мгновенные (синхронные) действия гасили судорожный повторный клик.
 */
import { type Signal, signal } from '@angular/core';
import { isObservable, lastValueFrom, type Observable } from 'rxjs';

export interface AsyncActionOptions {
  /**
   * Keep `pending` true for at least this many milliseconds after the action
   * starts. Use for synchronous/instant actions (e.g. add-to-cart) where the
   * work finishes in the same tick and a plain guard would reset immediately —
   * the floor swallows an accidental rapid second click.
   */
  readonly minDurationMs?: number;
  /** Called with the thrown value when the action rejects (after `pending` is released). */
  readonly onError?: (error: unknown) => void;
}

export interface AsyncAction {
  /** True while the action is running (or within its `minDurationMs` floor). */
  readonly pending: Signal<boolean>;
  /** Runs the action once; ignored (no-op) while a previous run is still pending. */
  readonly execute: () => Promise<void>;
}

/**
 * Builds a guarded action from `fn`. `fn` may return a Promise, an Observable
 * (awaited via its last value) or a synchronous value. Errors are swallowed —
 * pass `onError` to surface them — so the returned `execute` never rejects and
 * is safe to bind directly to a template `(click)`.
 */
export function createAsyncAction<T>(
  fn: () => Promise<T> | Observable<T> | T,
  options: AsyncActionOptions = {}
): AsyncAction {
  const pending = signal(false);

  const execute = async (): Promise<void> => {
    if (pending()) {
      return; // guard: a run is already in flight — block the repeat click.
    }
    pending.set(true);
    const startedAt = Date.now();
    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
      } else if (isObservable(result)) {
        await lastValueFrom(result);
      }
      // Synchronous result: nothing to await.
    } catch (error) {
      options.onError?.(error);
    } finally {
      const remaining = (options.minDurationMs ?? 0) - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, remaining));
      }
      pending.set(false); // always release, even on error.
    }
  };

  return { pending: pending.asReadonly(), execute };
}
