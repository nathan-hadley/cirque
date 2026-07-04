// Cloudflare Access JWT (RS256) verification. Returns { email } or null.
// JWKS fetching/caching lives in the middleware; this stays pure for tests.

function b64urlToBytes(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replaceAll("-", "+").replaceAll("_", "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function verifyAccessJwt(token, jwks, aud, issuer, now = Date.now()) {
  try {
    if (!aud || !issuer) return null; // fail closed on misconfiguration
    const [headerB64, payloadB64, sigB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !sigB64) return null;
    const decode = (part) => JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
    const header = decode(headerB64);
    const payload = decode(payloadB64);

    if (header.alg !== "RS256") return null;
    if (!payload.exp || payload.exp * 1000 < now) return null;
    if (payload.iss !== issuer) return null;
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(aud)) return null;

    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlToBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );
    return valid ? { email: payload.email ?? null } : null;
  } catch {
    return null;
  }
}
