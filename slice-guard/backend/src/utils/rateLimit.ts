/**
 * Simple in-memory rate limiter using a sliding window.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export class RateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number, windowMs: number) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    /**
     * Check if a request from the given key should be allowed.
     * Returns true if allowed, false if rate limited.
     */
    check(key: string): boolean {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now >= entry.resetAt) {
            this.store.set(key, { count: 1, resetAt: now + this.windowMs });
            return true;
        }

        if (entry.count >= this.maxRequests) {
            return false;
        }

        entry.count++;
        return true;
    }

    /** Periodically clean up expired entries to prevent memory leaks. */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now >= entry.resetAt) {
                this.store.delete(key);
            }
        }
    }
}

/** Rate limiter for auth endpoints: 10 requests per minute per IP */
export const authLimiter = new RateLimiter(10, 60_000);

// Clean up every 5 minutes
setInterval(() => authLimiter.cleanup(), 5 * 60_000);
