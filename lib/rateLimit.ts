// -----------------------------------------------------------------------------
// lib/rateLimit.ts
//
// Lightweight in-memory sliding-window rate limiter.
// Compatible with both Node.js (API routes) and Edge Runtime (proxy).
//
// Limitations:
//   - State is process-local. On distributed deployments (multiple Vercel Edge
//     instances) each instance tracks independently. Accepted trade-off for a
//     zero-dependency implementation. Supabase Auth also enforces its own
//     rate limits server-side for the actual auth calls.
//   - Map is cleaned up probabilistically (1% of calls) to avoid unbounded growth.
//
// Usage:
//   const result = checkRateLimit(`login:${ip}`, 10, 60_000);
//   if (!result.allowed) return 429;
// -----------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Module-level store — shared across all requests in the same process/instance.
const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Checks whether the given key is within the rate limit.
 *
 * @param key       Unique key for this bucket, e.g. `"login:1.2.3.4"`
 * @param limit     Maximum number of requests allowed in the window
 * @param windowMs  Window duration in milliseconds (e.g. 60_000 for 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  // Probabilistic cleanup — runs ~1% of calls to bound Map size
  if (Math.random() < 0.01) cleanup();

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // Start a new window for this key
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
