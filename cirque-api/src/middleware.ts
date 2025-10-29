import type { MiddlewareHandler } from "hono";
import type { Env } from "./types";

/**
 * Authentication middleware - validates API key from request header
 * Returns 401 Unauthorized if API key is missing or invalid
 */
export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next
) => {
  const apiKey = c.req.header("X-API-Key");
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  await next();
};

/**
 * Rate limiting middleware
 * Returns 429 Too Many Requests if limit is exceeded
 */
export const rateLimitMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next
) => {
  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const rateLimitKey = `ratelimit:${ip}`;
  const currentCount = await c.env.RATE_LIMIT_KV.get(rateLimitKey);
  const count = parseInt(currentCount || "0");

  if (count >= 50) {
    return c.json(
      { success: false, error: "Rate limit exceeded. Try again later." },
      429
    );
  }

  // Increment rate limit counter
  await c.env.RATE_LIMIT_KV.put(rateLimitKey, (count + 1).toString(), {
    expirationTtl: 3600, // 1 hour
  });

  await next();
};
