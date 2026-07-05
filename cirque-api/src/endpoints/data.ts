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
  // One batch: no round trip between the ETag aggregate and the data reads, so
  // the tag is always consistent with the body. ETag covers rejected rows too
  // (a rejection bumps updated_at but leaves the payload) and the visible
  // count catches hard deletes.
  const [aggResult, problems, documents] = await db.batch([
    db.prepare(
      "SELECT coalesce(max(updated_at), '') AS max_updated, sum(status != 'rejected') AS count, " +
        "(SELECT coalesce(max(updated_at), '') FROM documents) AS docs_max_updated FROM problems",
    ),
    db.prepare(
      `SELECT ${PUBLIC_COLS} FROM problems WHERE status != 'rejected' ORDER BY subarea, sort_order`,
    ),
    db.prepare("SELECT name, geojson FROM documents"),
  ]);
  const agg = (aggResult.results[0] ?? { max_updated: "", count: 0, docs_max_updated: "" }) as {
    max_updated: string;
    count: number;
    docs_max_updated: string;
  };
  const etag = computeEtag(agg, { max_updated: agg.docs_max_updated });
  if (etagMatches(c.req.header("If-None-Match"), etag)) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
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
  // The manifest only changes when images are uploaded; ETag from the listing
  // lets clients revalidate cheaply and a short max-age absorbs bursts.
  let maxUploaded = 0;
  for (const o of objects) maxUploaded = Math.max(maxUploaded, o.uploaded?.getTime() ?? 0);
  const etag = `"manifest:${objects.length}:${maxUploaded}"`;
  if (etagMatches(c.req.header("If-None-Match"), etag)) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
  const origin = new URL(c.req.url).origin;
  return c.json(buildManifest(objects, origin), 200, {
    ETag: etag,
    "Cache-Control": "public, max-age=300",
  });
}

export async function getImage(c: AppContext) {
  const key = c.req.path.replace(/^\/images\//, "");
  if (!isServableImageKey(key)) return c.text("Not found", 404);

  // Edge-cache image responses so repeat fetches skip the Worker/R2 entirely.
  const cache = caches.default;
  const cached = await cache.match(c.req.raw);
  if (cached) return cached;

  const obj = await c.env.IMAGES.get(key);
  if (!obj) return c.text("Not found", 404);
  if (etagMatches(c.req.header("If-None-Match"), obj.httpEtag)) {
    return new Response(null, { status: 304, headers: { ETag: obj.httpEtag } });
  }
  const res = new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/webp",
      ETag: obj.httpEtag,
      "Cache-Control": "public, max-age=86400",
    },
  });
  c.executionCtx.waitUntil(cache.put(c.req.raw, res.clone()));
  return res;
}
