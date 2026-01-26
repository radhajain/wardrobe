/**
 * Simple in-memory rate limiter
 *
 * For a personal app this is sufficient.
 * For production scale, use Redis or a dedicated rate limiting service.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const requests = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const cutoff = now - windowMs;

  for (const [key, entry] of requests.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      requests.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier (e.g., userId or IP)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  cleanupOldEntries(windowMs);

  let entry = requests.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    requests.set(key, entry);
  }

  // Remove timestamps outside the window
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Check if limit exceeded
  if (entry.timestamps.length >= limit) {
    const oldestInWindow = Math.min(...entry.timestamps);
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
    };
  }

  // Add current request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

/**
 * Rate limit response headers
 */
export function rateLimitHeaders(result: {
  remaining: number;
  resetAt: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
  };
}
