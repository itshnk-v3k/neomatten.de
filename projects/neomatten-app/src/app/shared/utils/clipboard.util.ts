/*
 * EN: Fallback-aware copy-to-clipboard. The async Clipboard API
 *     (navigator.clipboard.writeText) only works in a secure context — HTTPS or
 *     localhost — so on a phone reaching the dev server over a LAN IP
 *     (192.168.x.x) or plain HTTP it silently rejects. This helper tries the
 *     modern API first, then falls back to a hidden <textarea> + execCommand so
 *     copy still works on HTTP / older browsers. Returns whether it succeeded.
 * RU: Копирование в буфер с запасным путём. Асинхронный Clipboard API
 *     (navigator.clipboard.writeText) работает только в защищённом контексте —
 *     HTTPS или localhost — поэтому на телефоне через LAN-IP (192.168.x.x) или
 *     обычный HTTP он молча отклоняется. Сначала пробуем современный API, затем —
 *     скрытый <textarea> + execCommand, чтобы копирование работало и по HTTP /
 *     в старых браузерах. Возвращает, удалось ли скопировать.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API — works on HTTPS / localhost (secure context).
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy fallback
    }
  }

  // Fallback for HTTP / local IP / older browsers.
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
