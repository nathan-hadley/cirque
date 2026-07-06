import { topoPrefix } from "./topos.mjs";

// GeoJSON feature ↔ problems-row mapping (ADR 0001 §1). Shared contract:
// the import script and the Worker must agree on these columns.
export function featureToProblemRow(feature, { id, now, status = "pending" }) {
  const p = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  const order = p.order === "" || p.order == null ? null : Number(p.order);
  return {
    id,
    name: p.name,
    grade: p.grade ?? null,
    subarea: p.subarea ?? null,
    color: p.color ?? null,
    sort_order: Number.isFinite(order) ? order : null,
    description: p.description ?? null,
    lat,
    lng,
    line: p.line ?? null,
    topo_key: p.topo ? topoPrefix(p.topo) : null,
    status,
    created_at: now,
    updated_at: now,
  };
}
