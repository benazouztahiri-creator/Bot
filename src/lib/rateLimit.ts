import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  redis = null;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore) {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
}

export async function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);

  if (redis) {
    try {
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
        return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
      }
      const ttl = await redis.ttl(redisKey);
      if (count > maxRequests) {
        return { allowed: false, remaining: 0, resetAt: now + ttl * 1000 };
      }
      return { allowed: true, remaining: maxRequests - count, resetAt: now + ttl * 1000 };
    } catch {
      // Redis error, fall through
    }
  }

  const record = memoryStore.get(key);
  const resetAt = now + windowMs;

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
