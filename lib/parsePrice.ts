// -----------------------------------------------------------------------------
// lib/parsePrice.ts
//
// The `courses.price` and `courses.premium_price` columns are stored as text
// in Supabase (e.g. "N24,999", "N32,999", "Free", or NULL) rather than clean
// numbers. Number(value) on these strings returns NaN, and NaN silently
// becomes null when a Next.js API response is JSON-serialized — which is what
// caused every course to render as ₦0 (or crash, before defensive checks were
// added on the frontend).
//
// This parser strips the currency prefix and thousands separators, treats
// "Free"/empty/null as 0, and falls back to 0 with a console.error for
// anything else it can't confidently parse — so bad data degrades to a
// visible ₦0 (already the established pattern in the admin UI) instead of
// crashing or silently returning null.
// -----------------------------------------------------------------------------

export function parsePrice(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;

  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : 0;
  }

  if (typeof raw !== 'string') {
    console.error('[parsePrice] received a non-string, non-number value:', raw);
    return 0;
  }

  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'free') return 0;

  // Strip currency symbols (N, ₦), commas, and whitespace, keep digits + one decimal point.
  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed)) {
    console.error('[parsePrice] could not parse price value:', raw);
    return 0;
  }

  return Math.round(parsed);
}
