import type { AppContext } from "../types";

// All handlers here sit behind accessMiddleware (Cloudflare Access).

const EDITABLE_COLS = [
  "name", "grade", "subarea", "color", "sort_order", "description",
  "lat", "lng", "line", "topo_key", "status",
] as const;

export async function listProblems(c: AppContext) {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM problems ORDER BY created_at DESC",
  ).all();
  return c.json(results);
}

export async function updateProblem(c: AppContext) {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const cols = EDITABLE_COLS.filter((col) => col in body);
  if (cols.length === 0) return c.json({ success: false, error: "No editable fields" }, 400);
  // D1 binds only scalars; reject arrays/objects up front instead of 500ing.
  const nonScalar = cols.find((col) => body[col] !== null && typeof body[col] === "object");
  if (nonScalar) {
    return c.json({ success: false, error: `Field ${nonScalar} must be a scalar` }, 400);
  }
  if (body.status && !["pending", "approved", "rejected"].includes(body.status)) {
    return c.json({ success: false, error: "Invalid status" }, 400);
  }
  const sets = cols.map((col) => `${col} = ?`).join(", ");
  const result = await c.env.DB.prepare(
    `UPDATE problems SET ${sets}, updated_at = ? WHERE id = ?`,
  )
    .bind(...cols.map((col) => body[col]), new Date().toISOString(), id)
    .run();
  if (result.meta.changes === 0) return c.json({ success: false, error: "Not found" }, 404);
  return c.json({ success: true });
}

export function reviewProblem(status: "approved" | "rejected") {
  return async (c: AppContext) => {
    const id = c.req.param("id");
    const rawNote = (await c.req.json().catch(() => ({})))?.note;
    const note = typeof rawNote === "string" ? rawNote : null;
    const now = new Date().toISOString();
    const result = await c.env.DB.prepare(
      "UPDATE problems SET status = ?, review_note = ?, reviewed_at = ?, updated_at = ? WHERE id = ?",
    )
      .bind(status, note, now, now, id)
      .run();
    if (result.meta.changes === 0) return c.json({ success: false, error: "Not found" }, 404);
    return c.json({ success: true });
  };
}

export async function getDocument(c: AppContext) {
  const row = await c.env.DB.prepare("SELECT name, geojson, updated_at FROM documents WHERE name = ?")
    .bind(c.req.param("name"))
    .first();
  if (!row) return c.json({ success: false, error: "Not found" }, 404);
  return c.json(row);
}

export async function putDocument(c: AppContext) {
  const name = c.req.param("name");
  const text = await c.req.text();
  try {
    const parsed = JSON.parse(text);
    if (parsed?.type !== "FeatureCollection") throw new Error("not a FeatureCollection");
  } catch (e) {
    return c.json({ success: false, error: `Invalid GeoJSON: ${(e as Error).message}` }, 400);
  }
  await c.env.DB.prepare(
    "INSERT INTO documents (name, geojson, updated_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(name) DO UPDATE SET geojson = excluded.geojson, updated_at = excluded.updated_at",
  )
    .bind(name, JSON.stringify(JSON.parse(text)), new Date().toISOString())
    .run();
  return c.json({ success: true });
}
