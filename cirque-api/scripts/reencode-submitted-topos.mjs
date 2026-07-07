// Re-encode app-submitted topos (JPEG bytes stored under .webp keys by
// POST /v1/problems) into real WebP full/thumb variants.
//
// Usage:
//   CIRQUE_API_KEY=... node scripts/reencode-submitted-topos.mjs           # dry run
//   CIRQUE_API_KEY=... node scripts/reencode-submitted-topos.mjs --apply   # rewrite in R2
//
// Requires `wrangler login`. Run after reviewing a batch of submissions.
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeTopoVariants } from "./encodeTopo.mjs";
import { reencodeTargets } from "./reencodeTargets.mjs";

const BUCKET = "cirque-images";
const BASE = process.env.CIRQUE_API_BASE ?? "https://cirque-api.nathan-hadley.workers.dev";
const KEY = process.env.CIRQUE_API_KEY;
if (!KEY) throw new Error("Set CIRQUE_API_KEY");

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = (args) =>
  execFileSync(path.join(apiRoot, "node_modules", ".bin", "wrangler"), args, { cwd: apiRoot });

const manifestRes = await fetch(`${BASE}/v1/images/manifest`, { headers: { "X-API-Key": KEY } });
if (!manifestRes.ok) throw new Error(`manifest → ${manifestRes.status}`);
const manifest = await manifestRes.json();

const contentTypeByUrl = new Map();
for (const entry of manifest) {
  const head = await fetch(entry.fullUrl, { method: "HEAD" });
  contentTypeByUrl.set(entry.fullUrl, head.headers.get("content-type"));
}

const targets = reencodeTargets(manifest, contentTypeByUrl);
console.log(`${targets.length} of ${manifest.length} topos need re-encoding`);
if (targets.length === 0) process.exit(0);
for (const t of targets) console.log(`  ${t.slug}`);

if (!process.argv.includes("--apply")) {
  console.log("Dry run. Re-run with --apply to rewrite them in R2.");
  process.exit(0);
}

const work = await mkdtemp(path.join(tmpdir(), "reencode-"));
for (const t of targets) {
  const src = path.join(work, `${t.slug}.jpeg`);
  wrangler(["r2", "object", "get", `${BUCKET}/${t.original}`, "--file", src, "--remote"]);
  const { full, thumb } = await encodeTopoVariants(await readFile(src));
  for (const [key, data] of [
    [t.full, full],
    [t.thumb, thumb],
  ]) {
    const out = path.join(work, path.basename(key) + "." + t.slug);
    await writeFile(out, data);
    wrangler(["r2", "object", "put", `${BUCKET}/${key}`, "--file", out,
      "--content-type", "image/webp", "--remote"]);
  }
  console.log(`re-encoded ${t.slug}`);
}
console.log("Done.");
