import { describe, expect, test } from "vitest";
import {
  buildDataPayload,
  buildManifest,
  computeEtag,
  etagMatches,
  isServableImageKey,
  problemRowToFeature,
} from "./dataApi.mjs";

const row = {
  id: "uuid-1",
  name: "The Shallow",
  grade: "V0",
  subarea: "Forestland",
  color: "black",
  sort_order: 1,
  description: "Climb the tall face.",
  lat: 47.5,
  lng: -120.7,
  line: "[[315,278],[287,217]]",
  topo_key: "topos/forestland-cube-crack",
  status: "approved",
  submitted_by_name: "Nathan",
  submitted_by_email: "secret@example.com",
  user_id: null,
  device_id: "device-1",
  review_note: "internal note",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-02T00:00:00.000Z",
  reviewed_at: null,
};

describe("problemRowToFeature", () => {
  test("maps a row to a GeoJSON feature with public properties only", () => {
    const f = problemRowToFeature(row);
    expect(f).toEqual({
      type: "Feature",
      properties: {
        id: "uuid-1",
        name: "The Shallow",
        grade: "V0",
        subarea: "Forestland",
        color: "black",
        order: 1,
        description: "Climb the tall face.",
        line: "[[315,278],[287,217]]",
        topo: "forestland-cube-crack",
        topoKey: "topos/forestland-cube-crack",
        status: "approved",
      },
      geometry: { type: "Point", coordinates: [-120.7, 47.5] },
    });
    const json = JSON.stringify(f);
    expect(json).not.toContain("secret@example.com");
    expect(json).not.toContain("device-1");
    expect(json).not.toContain("internal note");
  });

  test("handles null topo_key", () => {
    const f = problemRowToFeature({ ...row, topo_key: null });
    expect(f.properties.topo).toBeNull();
    expect(f.properties.topoKey).toBeNull();
  });
});

describe("buildDataPayload", () => {
  test("wraps problems in a FeatureCollection and parses documents", () => {
    const payload = buildDataPayload(
      [row],
      [{ name: "areas", geojson: '{"type":"FeatureCollection","features":[]}' }],
    );
    expect(payload.problems.type).toBe("FeatureCollection");
    expect(payload.problems.features).toHaveLength(1);
    expect(payload.documents.areas).toEqual({ type: "FeatureCollection", features: [] });
  });
});

describe("computeEtag", () => {
  test("changes when any updated_at or count changes, quoted for the header", () => {
    const a = computeEtag({ max_updated: "2026-07-02", count: 171 }, { max_updated: "2026-07-01" });
    const same = computeEtag({ max_updated: "2026-07-02", count: 171 }, { max_updated: "2026-07-01" });
    const bumped = computeEtag({ max_updated: "2026-07-03", count: 171 }, { max_updated: "2026-07-01" });
    const removed = computeEtag({ max_updated: "2026-07-02", count: 170 }, { max_updated: "2026-07-01" });
    expect(a).toBe(same);
    expect(a).not.toBe(bumped);
    expect(a).not.toBe(removed);
    expect(a).toMatch(/^".+"$/);
  });
});

describe("etagMatches", () => {
  test("matches exact, weak, and list forms; rejects others", () => {
    const etag = '"abc:171:def"';
    expect(etagMatches('"abc:171:def"', etag)).toBe(true);
    expect(etagMatches('W/"abc:171:def"', etag)).toBe(true);
    expect(etagMatches('"other", "abc:171:def"', etag)).toBe(true);
    expect(etagMatches('"other"', etag)).toBe(false);
    expect(etagMatches(undefined, etag)).toBe(false);
  });
});

describe("isServableImageKey", () => {
  test("allows only topo variant keys", () => {
    expect(isServableImageKey("topos/forestland-alcove/full.webp")).toBe(true);
    expect(isServableImageKey("topos/1751600000000-abc_123/thumb.webp")).toBe(true);
    expect(isServableImageKey("originals/forestland-alcove.jpeg")).toBe(false);
    expect(isServableImageKey("topos/x/../../originals/y.jpeg")).toBe(false);
    expect(isServableImageKey("topos/slug/other.webp")).toBe(false);
    expect(isServableImageKey("")).toBe(false);
  });
});

describe("buildManifest", () => {
  const objects = [
    { key: "topos/forestland-alcove/full.webp", size: 91310, etag: "abc" },
    { key: "topos/forestland-alcove/thumb.webp", size: 23194, etag: "def" },
    { key: "topos/no-thumb-yet/full.webp", size: 150000, etag: "ghi" },
  ];

  test("groups variants by topo key with absolute urls", () => {
    const m = buildManifest(objects, "https://api.example.com");
    expect(m).toEqual([
      {
        topoKey: "topos/forestland-alcove",
        fullUrl: "https://api.example.com/images/topos/forestland-alcove/full.webp",
        thumbUrl: "https://api.example.com/images/topos/forestland-alcove/thumb.webp",
        bytes: 91310,
        hash: "abc",
      },
      {
        topoKey: "topos/no-thumb-yet",
        fullUrl: "https://api.example.com/images/topos/no-thumb-yet/full.webp",
        thumbUrl: "https://api.example.com/images/topos/no-thumb-yet/full.webp",
        bytes: 150000,
        hash: "ghi",
      },
    ]);
  });

  test("ignores originals and unknown keys", () => {
    const m = buildManifest([{ key: "originals/x.jpeg", size: 1, etag: "z" }], "https://a.b");
    expect(m).toEqual([]);
  });
});
