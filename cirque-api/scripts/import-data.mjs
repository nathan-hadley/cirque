// Phase 2 of ADR 0001: import cirque-data GeoJSON into D1.
//
// Usage:
//   node scripts/import-data.mjs            # write scripts/out/import.sql only
//   node scripts/import-data.mjs --local    # + apply to local D1 (wrangler dev state)
//   node scripts/import-data.mjs --remote   # + apply to production D1
//
// Bootstrap-only: deterministic ids + INSERT OR REPLACE make re-runs safe while
// D1 only holds this import. Do NOT re-run once live submissions or admin edits
// exist — REPLACE resets created_at/review fields and renamed problems get new ids.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { featureToProblemRow } from "../src/problems.mjs";
import { deterministicId, insertSql } from "./importData.mjs";

const DB = "cirque-db";
const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "..");
const dataRoot = path.resolve(here, "../../cirque-data");
const outFile = path.join(here, "out", "import.sql");

const DOCUMENTS = {
  areas: "areas/areas.geojson",
  boulders: "boulders/boulders.geojson",
  subareas: "subareas/subareas.geojson",
  "subarea-centers": "subareas/subarea-centers.geojson",
};

const now = new Date().toISOString();
const statements = [];

const problems = JSON.parse(await readFile(path.join(dataRoot, "problems/problems.geojson"), "utf8"));
for (const feature of problems.features) {
  const { subarea, name } = feature.properties;
  // name/subarea form the deterministic id and name is NOT NULL in D1 —
  // fail fast with a useful message instead of importing junk rows.
  if (!name || !subarea) {
    throw new Error(`Feature missing name/subarea: ${JSON.stringify(feature.properties)}`);
  }
  const id = deterministicId(`${subarea}/${name}`);
  statements.push(insertSql("problems", featureToProblemRow(feature, { id, now, status: "approved" })));
}

for (const [name, rel] of Object.entries(DOCUMENTS)) {
  const geojson = JSON.stringify(JSON.parse(await readFile(path.join(dataRoot, rel), "utf8")));
  statements.push(insertSql("documents", { name, geojson, updated_at: now }));
}

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, statements.join("\n") + "\n");
console.log(`Wrote ${statements.length} statements (${problems.features.length} problems, ${Object.keys(DOCUMENTS).length} documents) → ${outFile}`);

const mode = process.argv.includes("--remote") ? "--remote" : process.argv.includes("--local") ? "--local" : null;
if (mode) {
  const run = (args) =>
    execFileSync(path.join(apiRoot, "node_modules", ".bin", "wrangler"), args, {
      cwd: apiRoot,
      stdio: "inherit",
    });
  run(["d1", "migrations", "apply", DB, mode]);
  run(["d1", "execute", DB, mode, "--file", outFile, "-y"]);
  run(["d1", "execute", DB, mode, "-y", "--command",
    "SELECT (SELECT count(*) FROM problems) AS problems, (SELECT count(*) FROM documents) AS documents;"]);
}
