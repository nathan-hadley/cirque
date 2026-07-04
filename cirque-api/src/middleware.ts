import type { MiddlewareHandler } from "hono";
import type { Env } from "./types";
import { verifyAccessJwt } from "./accessJwt.mjs";

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
 * Cloudflare Access middleware for /admin and /v1/admin/*.
 * Fails closed: without Access config the only way in is the explicit local
 * dev bypass (.dev.vars, never a deployed secret).
 */
let jwksCache: { keys: object[] } | null = null;
let jwksFetchedAt = 0;

export const accessMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const { ACCESS_TEAM_DOMAIN, ACCESS_AUD, ADMIN_DEV_BYPASS } = c.env;
  if (!ACCESS_TEAM_DOMAIN || !ACCESS_AUD) {
    // Bypass is for `wrangler dev` only: never honored on a deployed hostname.
    const host = new URL(c.req.url).hostname;
    if (ADMIN_DEV_BYPASS === "true" && (host === "localhost" || host === "127.0.0.1")) {
      return next();
    }
    return c.json({ success: false, error: "Admin not configured" }, 403);
  }
  const token = c.req.header("Cf-Access-Jwt-Assertion");
  if (!token) return c.json({ success: false, error: "Forbidden" }, 403);

  if (!jwksCache || Date.now() - jwksFetchedAt > 60 * 60 * 1000) {
    const res = await fetch(`https://${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
    if (!res.ok) return c.json({ success: false, error: "Auth unavailable" }, 503);
    jwksCache = await res.json();
    jwksFetchedAt = Date.now();
  }
  const identity = await verifyAccessJwt(
    token,
    jwksCache,
    ACCESS_AUD,
    `https://${ACCESS_TEAM_DOMAIN}`,
  );
  if (!identity) return c.json({ success: false, error: "Forbidden" }, 403);
  await next();
};

/**
 * Rate limiting middleware factory (per IP, 24h KV window).
 * Returns 429 Too Many Requests if the limit is exceeded.
 */
function makeRateLimiter(limit: number, prefix: string): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const rateLimitKey = `${prefix}:${ip}`;
    const currentCount = await c.env.RATE_LIMIT_KV.get(rateLimitKey);
    const count = parseInt(currentCount || "0");

    if (count >= limit) {
      console.warn({
        event: "rate_limit_exceeded",
        prefix,
        ip,
        count,
        timestamp: new Date().toISOString(),
      });
      return c.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        429
      );
    }

    await c.env.RATE_LIMIT_KV.put(rateLimitKey, (count + 1).toString(), {
      expirationTtl: 60 * 60 * 24, // 24 hours
    });

    await next();
  };
}

// Submissions keep the original budget; reads get a per-launch-friendly one.
export const rateLimitMiddleware = makeRateLimiter(50, "ratelimit");
export const readRateLimitMiddleware = makeRateLimiter(1000, "ratelimit-read");
