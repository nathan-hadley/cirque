import { normalizePayload, useDataStore } from "./dataStore";

jest.mock("@/assets/seed.json", () => ({
  problems: {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: { name: "Seed problem" } }],
  },
  documents: {
    areas: { type: "FeatureCollection", features: [] },
    boulders: { type: "FeatureCollection", features: [] },
    subareas: { type: "FeatureCollection", features: [{ type: "Feature", properties: {} }] },
    "subarea-centers": {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: {} }],
    },
  },
}));

const payload = {
  problems: {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: { name: "X" } }],
  },
  documents: {
    areas: { type: "FeatureCollection", features: [] },
    boulders: { type: "FeatureCollection", features: [] },
    // Cloud naming: `subareas` = polygons, `subarea-centers` = label points.
    subareas: {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { kind: "polygon" } }],
    },
    "subarea-centers": {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { kind: "center" } }],
    },
  },
};

describe("normalizePayload", () => {
  it("maps cloud document names to app-side names", () => {
    const data = normalizePayload(payload);
    expect(data).not.toBeNull();
    expect(data!.problems.features).toHaveLength(1);
    expect(data!.subareaPolygons.features[0].properties).toEqual({ kind: "polygon" });
    expect(data!.subareaCenters.features[0].properties).toEqual({ kind: "center" });
    expect(data!.areas.type).toBe("FeatureCollection");
    expect(data!.boulders.type).toBe("FeatureCollection");
  });

  it("converts closed LineString rings to Polygons for fill layers", () => {
    const ring = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ];
    const openLine = [
      [0, 0],
      [1, 1],
    ];
    const data = normalizePayload({
      ...payload,
      documents: {
        ...payload.documents,
        boulders: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: ring },
            },
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: openLine },
            },
          ],
        },
      },
    });
    expect(data!.boulders.features[0].geometry.type).toBe("Polygon");
    expect((data!.boulders.features[0].geometry as GeoJSON.Polygon).coordinates).toEqual([ring]);
    expect(data!.boulders.features[1].geometry.type).toBe("LineString");
  });

  it("rejects malformed payloads", () => {
    expect(normalizePayload(null)).toBeNull();
    expect(normalizePayload({})).toBeNull();
    expect(normalizePayload({ problems: { type: "FeatureCollection" } })).toBeNull();
    expect(normalizePayload({ problems: payload.problems, documents: {} })).toBeNull();
  });
});

describe("useDataStore", () => {
  it("initializes from the bundled data payload", () => {
    const { data } = useDataStore.getState();
    expect(data.problems.features).toHaveLength(1);
    expect(data.subareaPolygons.features).toHaveLength(1);
    expect(data.subareaCenters.features).toHaveLength(1);
  });

  it("setData replaces data and records the etag", () => {
    const before = useDataStore.getState().data;
    useDataStore.getState().setData(normalizePayload(payload)!, '"etag-1"');
    expect(useDataStore.getState().data.problems.features).toHaveLength(1);
    expect(useDataStore.getState().etag).toBe('"etag-1"');
    useDataStore.getState().setData(before, null);
  });
});
