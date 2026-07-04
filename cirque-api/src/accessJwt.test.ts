import { beforeAll, describe, expect, test } from "vitest";
import { verifyAccessJwt } from "./accessJwt.mjs";

const AUD = "test-aud-tag";
const b64url = (data: string | Uint8Array) =>
  Buffer.from(data).toString("base64url");

let keyPair: CryptoKeyPair;
let jwks: { keys: object[] };

async function signJwt(payload: object, kid = "kid-1", key?: CryptoKey) {
  const header = { alg: "RS256", kid };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key ?? keyPair.privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${b64url(new Uint8Array(sig))}`;
}

beforeAll(async () => {
  keyPair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  jwks = { keys: [{ ...jwk, kid: "kid-1", alg: "RS256", use: "sig" }] };
});

const ISS = "https://myteam.cloudflareaccess.com";
const validPayload = () => ({
  aud: [AUD],
  iss: ISS,
  email: "nathan@example.com",
  exp: Math.floor(Date.now() / 1000) + 600,
  iat: Math.floor(Date.now() / 1000),
});

describe("verifyAccessJwt", () => {
  test("accepts a valid token and returns the identity", async () => {
    const token = await signJwt(validPayload());
    const result = await verifyAccessJwt(token, jwks, AUD, ISS);
    expect(result).toEqual({ email: "nathan@example.com" });
  });

  test("rejects wrong audience", async () => {
    const token = await signJwt({ ...validPayload(), aud: ["other-app"] });
    expect(await verifyAccessJwt(token, jwks, AUD, ISS)).toBeNull();
  });

  test("rejects wrong or missing issuer", async () => {
    const wrongIss = await signJwt({ ...validPayload(), iss: "https://evil.example.com" });
    expect(await verifyAccessJwt(wrongIss, jwks, AUD, ISS)).toBeNull();
    const noIss = await signJwt({ ...validPayload(), iss: undefined });
    expect(await verifyAccessJwt(noIss, jwks, AUD, ISS)).toBeNull();
  });

  test("rejects when expected aud is missing (misconfiguration fails closed)", async () => {
    const token = await signJwt({ ...validPayload(), aud: [undefined] });
    expect(await verifyAccessJwt(token, jwks, undefined as unknown as string, ISS)).toBeNull();
  });

  test("rejects expired token", async () => {
    const token = await signJwt({ ...validPayload(), exp: Math.floor(Date.now() / 1000) - 10 });
    expect(await verifyAccessJwt(token, jwks, AUD, ISS)).toBeNull();
  });

  test("rejects unknown kid", async () => {
    const token = await signJwt(validPayload(), "unknown-kid");
    expect(await verifyAccessJwt(token, jwks, AUD, ISS)).toBeNull();
  });

  test("rejects tampered signature", async () => {
    const other = (await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
    const token = await signJwt(validPayload(), "kid-1", other.privateKey);
    expect(await verifyAccessJwt(token, jwks, AUD, ISS)).toBeNull();
  });

  test("rejects garbage", async () => {
    expect(await verifyAccessJwt("not-a-jwt", jwks, AUD, ISS)).toBeNull();
    expect(await verifyAccessJwt("", jwks, AUD, ISS)).toBeNull();
  });
});
