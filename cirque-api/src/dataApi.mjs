// Pure logic for GET /v1/data and GET /v1/images/manifest.

// Whitelist mapping: PII (submitted_by_*, device_id, review_note) never leaves
// this function. `topo` keeps the legacy slug shape the app already renders.
export function problemRowToFeature(row) {
  return {
    type: "Feature",
    properties: {
      id: row.id,
      name: row.name,
      grade: row.grade,
      subarea: row.subarea,
      color: row.color,
      order: row.sort_order,
      description: row.description,
      line: row.line,
      topo: row.topo_key ? row.topo_key.replace(/^topos\//, "") : null,
      topoKey: row.topo_key,
      status: row.status,
    },
    geometry: { type: "Point", coordinates: [row.lng, row.lat] },
  };
}

export function buildDataPayload(problemRows, documentRows) {
  const documents = {};
  for (const d of documentRows) documents[d.name] = JSON.parse(d.geojson);
  return {
    problems: {
      type: "FeatureCollection",
      features: problemRows.map(problemRowToFeature),
    },
    documents,
  };
}

// Includes rejected problems' updated_at and the visible row count, so both
// edits and removals change the tag.
export function computeEtag(problemsAgg, documentsAgg) {
  return `"${problemsAgg.max_updated}:${problemsAgg.count}:${documentsAgg.max_updated}"`;
}

// RFC 7232-lenient If-None-Match check: weak prefixes and comma lists match.
export function etagMatches(headerValue, etag) {
  if (!headerValue) return false;
  return headerValue
    .split(",")
    .map((v) => v.trim().replace(/^W\//, ""))
    .includes(etag);
}

// Public image serving is restricted to topo variants; originals/ stays private.
export function isServableImageKey(key) {
  return /^topos\/[A-Za-z0-9_-]+\/(full|thumb)\.webp$/.test(key);
}

export function buildManifest(r2Objects, origin) {
  const bySlugPrefix = new Map();
  for (const obj of r2Objects) {
    const m = obj.key.match(/^(topos\/.+)\/(full|thumb)\.webp$/);
    if (!m) continue;
    const entry = bySlugPrefix.get(m[1]) ?? { topoKey: m[1] };
    entry[m[2]] = obj;
    bySlugPrefix.set(m[1], entry);
  }
  const manifest = [];
  for (const { topoKey, full, thumb } of bySlugPrefix.values()) {
    if (!full) continue;
    manifest.push({
      topoKey,
      fullUrl: `${origin}/images/${full.key}`,
      thumbUrl: `${origin}/images/${(thumb ?? full).key}`,
      bytes: full.size,
      hash: full.etag,
    });
  }
  return manifest;
}
