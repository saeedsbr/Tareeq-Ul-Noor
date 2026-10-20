/** Relative time in the visitor's chosen language (native Intl, so it works for every supported language). */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const lang = typeof document !== 'undefined' && document.documentElement.lang ? document.documentElement.lang : 'en';
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [number, Intl.RelativeTimeFormatUnit][] = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  for (const [n, unit] of units) if (s >= n) return rtf.format(-Math.floor(s / n), unit);
  return rtf.format(0, 'second');
}
export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(typeof document !== 'undefined' && document.documentElement.lang ? document.documentElement.lang : 'en') : '');
export const statusLabel: Record<string, string> = { SUBMITTED: 'Pending', ANSWERED: 'Answered', RESOLVED: 'Resolved', HIDDEN: 'Hidden' };

/** Recent items read "2 hours ago"; older ones read "October 6" (in the chosen language). */
export function whenShort(iso?: string | null): string {
  if (!iso) return '';
  if (Date.now() - new Date(iso).getTime() < 7 * 86400000) return timeAgo(iso);
  const lang = typeof document !== 'undefined' && document.documentElement.lang ? document.documentElement.lang : 'en';
  return new Date(iso).toLocaleDateString(lang, { month: 'long', day: 'numeric' });
}
