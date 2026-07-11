// Regenerates assets/seed.json (the bundled first-launch snapshot) from GET /v1/data.
// Usage: EXPO_PUBLIC_API_BASE_URL=... EXPO_PUBLIC_API_KEY=... node scripts/fetch-seed.mjs
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.EXPO_PUBLIC_API_BASE_URL;
const key = process.env.EXPO_PUBLIC_API_KEY;
if (!base || !key) throw new Error("Set EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_API_KEY");

const res = await fetch(`${base}/v1/data`, { headers: { "X-API-Key": key } });
if (!res.ok) throw new Error(`GET /v1/data -> ${res.status}`);
const payload = await res.json();
// Mirror the app's normalizePayload requirements: every collection must be valid
// or the bundled seed would brick first launch.
const collections = [
  payload?.problems,
  payload?.documents?.areas,
  payload?.documents?.boulders,
  payload?.documents?.subareas,
  payload?.documents?.["subarea-centers"],
];
for (const fc of collections) {
  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
    throw new Error("Malformed payload: every collection must be a FeatureCollection");
  }
}

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/seed.json");
await writeFile(out, JSON.stringify(payload));
console.log(`Wrote ${payload.problems.features.length} problems -> ${out}`);
