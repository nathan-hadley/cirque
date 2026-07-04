import type { AppContext } from "../types";
import {
  buildDataPayload,
  buildManifest,
  computeEtag,
  etagMatches,
  isServableImageKey,
} from "../dataApi.mjs";

const PUBLIC_COLS =
  "id, name, grade, subarea, color, sort_order, description, lat, lng, line, topo_key, status, updated_at";

export async function getData(c: AppContext) {
  const db = c.env.DB;
  // ETag covers rejected rows too: a rejection bumps updated_at but removes the
  // row from the payload, and the visible count catches hard deletes.
  const agg = await db
    .prepare(
      "SELECT coalesce(max(updated_at), '') AS max_updated, sum(status != 'rejected') AS count, " +
        "(SELECT coalesce(max(updated_at), '') FROM documents) AS docs_max_updated FROM problems",
    )
    .first<{ max_updated: string; count: number; docs_max_updated: string }>();
  const etag = computeEtag(agg, { max_updated: agg?.docs_max_updated });
  if (etagMatches(c.req.header("If-None-Match"), etag)) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  const [problems, documents] = await db.batch([
    db.prepare(
      `SELECT ${PUBLIC_COLS} FROM problems WHERE status != 'rejected' ORDER BY subarea, sort_order`,
    ),
    db.prepare("SELECT name, geojson FROM documents"),
  ]);
  return c.json(buildDataPayload(problems.results, documents.results), 200, {
    ETag: etag,
    "Cache-Control": "no-cache",
  });
}

export async function getImagesManifest(c: AppContext) {
  const objects = [];
  let cursor: string | undefined;
  do {
    const page = await c.env.IMAGES.list({ prefix: "topos/", cursor });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const origin = new URL(c.req.url).origin;
  return c.json(buildManifest(objects, origin), 200, { "Cache-Control": "no-cache" });
}

export async function getImage(c: AppContext) {
  const key = c.req.path.replace(/^\/images\//, "");
  if (!isServableImageKey(key)) return c.text("Not found", 404);
  const obj = await c.env.IMAGES.get(key);
  if (!obj) return c.text("Not found", 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/webp",
      ETag: obj.httpEtag,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
