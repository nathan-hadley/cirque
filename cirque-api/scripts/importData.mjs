import { createHash } from "node:crypto";

// UUIDv5-style: sha1 of the natural key, formatted as a UUID. Stable across
// runs so the bootstrap import can INSERT OR REPLACE instead of duplicating.
export function deterministicId(naturalKey) {
  const h = createHash("sha1").update(`cirque-problem:${naturalKey}`).digest("hex");
  return [h.slice(0, 8), h.slice(8, 12), `5${h.slice(13, 16)}`, `8${h.slice(17, 20)}`, h.slice(20, 32)].join("-");
}

function sqlLiteral(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return `'${String(v).replaceAll("'", "''")}'`;
}

export function insertSql(table, row) {
  const cols = Object.keys(row);
  const vals = cols.map((c) => sqlLiteral(row[c]));
  return `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")});`;
}
