// Phase 1 of ADR 0001: re-encode the topo back catalog and upload to R2.
//
// Usage:
//   node scripts/migrate-topos.mjs           # encode into scripts/out/ (mirrors R2 keys)
//   node scripts/migrate-topos.mjs --upload  # encode, then upload everything to R2
//
// Upload requires `wrangler login` and the bucket to exist:
//   npx wrangler r2 bucket create cirque-images
import { execFile as execFileCb, execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { encodeTopoVariants } from "./encodeTopo.mjs";
import { topoKeys } from "../src/topos.mjs";

const execFile = promisify(execFileCb);
const BUCKET = "cirque-images";
const CONCURRENCY = 8;
const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "..");
const wranglerBin = path.join(apiRoot, "node_modules", ".bin", "wrangler");
const SRC = path.resolve(here, "../../react-native/assets/topos");
const OUT = path.join(here, "out");

const entries = await readdir(SRC);
const files = entries.filter((f) => f.endsWith(".jpeg"));
const skipped = entries.filter((f) => !f.endsWith(".jpeg"));
if (skipped.length) console.warn(`WARNING: skipping non-.jpeg files: ${skipped.join(", ")}`);
console.log(`Encoding ${files.length} topos from ${SRC}`);

const uploads = [];
const encodeFailures = [];
for (const file of files) {
  const uploadsStart = uploads.length;
  try {
    const slug = path.basename(file, ".jpeg");
    const keys = topoKeys(slug);
    const input = await readFile(path.join(SRC, file));
    const { full, thumb } = await encodeTopoVariants(input);

    for (const [key, data] of [
      [keys.full, full],
      [keys.thumb, thumb],
    ]) {
      const outPath = path.join(OUT, key);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, data);
      uploads.push([key, outPath, "image/webp"]);
    }

    const origPath = path.join(OUT, keys.original);
    await mkdir(path.dirname(origPath), { recursive: true });
    await copyFile(path.join(SRC, file), origPath);
    uploads.push([keys.original, origPath, "image/jpeg"]);
  } catch (err) {
    uploads.length = uploadsStart; // drop partial variants of the failed file
    encodeFailures.push(file);
    console.error(`ENCODE FAILED ${file}: ${err.message}`);
  }
}
if (encodeFailures.length) {
  console.error(`\n${encodeFailures.length} files failed to encode: ${encodeFailures.join(", ")}`);
}

const totalMB = (dir) =>
  execFileSync("du", ["-sh", dir], { encoding: "utf8" }).split("\t")[0].trim();
console.log(`Encoded ${files.length} topos → ${OUT}`);
console.log(`  topos/ (webp variants): ${totalMB(path.join(OUT, "topos"))}`);
console.log(`  originals/ (archive):   ${totalMB(path.join(OUT, "originals"))}`);

if (process.argv.includes("--upload")) {
  const failures = [];
  let done = 0;
  const queue = [...uploads];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const [key, file, contentType] = job;
        try {
          await execFile(
            wranglerBin,
            ["r2", "object", "put", `${BUCKET}/${key}`,
             "--file", file, "--content-type", contentType, "--remote"],
            { cwd: apiRoot },
          );
          console.log(`[${++done}/${uploads.length}] ${key}`);
        } catch (err) {
          failures.push(key);
          console.error(`FAILED ${key}: ${err.stderr?.trim() || err.message}`);
        }
      }
    }),
  );
  if (failures.length) {
    console.error(`\n${failures.length} uploads failed:\n${failures.join("\n")}`);
    console.error("Re-run with --upload to retry (puts are idempotent).");
    process.exit(1);
  }
  console.log("Upload complete.");
} else {
  console.log("Dry run (no upload). Re-run with --upload to push to R2.");
}
