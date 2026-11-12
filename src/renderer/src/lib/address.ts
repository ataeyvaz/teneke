/**
 * Ctrl+Enter in the address bar: a bare word like "google" becomes
 * "www.google.com", like in other browsers. Anything that already looks like
 * an address, a search with spaces or a URL is left alone. Only text is
 * produced here; the main process still decides what it really is.
 */
export function completeWithCom(text: string): string {
  const input = text.trim()
  return /^[\p{L}\p{N}][\p{L}\p{N}-]*$/u.test(input) ? `www.${input}.com` : input
}
