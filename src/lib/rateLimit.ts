import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

const redis = Redis.fromEnv();

const limiters = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.maxRequests}:${config.windowMs}`;

  let limiter = limiters.get(key);

  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.maxRequests,
        `${config.windowMs} ms`,
      ),
      prefix: "vayuguard:ratelimit",
    });

    limiters.set(key, limiter);
  }

  return limiter;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    maxRequests: 20,
    windowMs: 60_000,
  },
): Promise<RateLimitResult> {
  const limiter = getLimiter(config);
  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetInMs: Math.max(0, result.reset - Date.now()),
  };
}

export function getClientIp(request: Request): string {
  // Vercel overwrites this header with the connecting client's IP.
  const forwarded = request.headers.get("x-forwarded-for");

  const clientIp = forwarded?.split(",")[0]?.trim();

  if (clientIp) {
    return clientIp;
  }

  if (process.env.NODE_ENV !== "production") {
    return request.headers.get("x-real-ip")?.trim() || "local";
  }

  return "unknown";
}
