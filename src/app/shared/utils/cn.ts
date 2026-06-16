/*
 * EN: cn() — merges conditional class names and resolves Tailwind conflicts.
 *     Foundation of the shared UI kit's variant styling (clsx + tailwind-merge).
 * RU: cn() — объединяет условные классы и разрешает конфликты Tailwind. Основа
 *     стилизации вариантов общего UI-кита (clsx + tailwind-merge).
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditionally joins class names and resolves Tailwind conflicts.
 *
 * Foundation of the ZardUI-style shared UI kit (`src/app/shared/ui`): variant
 * classes from `class-variance-authority` are merged with consumer-provided
 * classes so the last conflicting utility wins (e.g. `px-2` overridden by
 * `px-4`). Mirrors the `cn()` helper used across shadcn-style libraries.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
