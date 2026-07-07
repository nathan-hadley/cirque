import { describe, expect, test } from "vitest";
import { GEOMETRY_CLIENT_JS } from "./geometryClient";

// Evaluate the browser source once and pull out the pure functions, so these
// tests exercise the exact code the admin page runs.
const geo = new Function(
  GEOMETRY_CLIENT_JS +
    "\nreturn { documentToEditorFeatures, editorFeaturesToDocument, DOCUMENT_GEOMETRY };",
)() as {
  documentToEditorFeatures: (name: string, fc: unknown) => any[];
  editorFeaturesToDocument: (name: string, features: unknown[]) => any;
  DOCUMENT_GEOMETRY: Record<string, string>;
};

const boulderDoc = {
  type: "FeatureCollection",
  generator: "JOSM",
  features: [
    {
      type: "Feature",
      properties: null,
      geometry: {
        type: "LineString",
        // A real closed boulder ring (first coord repeated at the end).
        coordinates: [
          [-120.72144001857, 47.5426820377],
          [-120.72150573269, 47.5427028596],
          [-120.72154730693, 47.54270467021],
          [-120.72144001857, 47.5426820377],
        ],
      },
    },
  ],
};

const pointDoc = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Swiftwater" }, geometry: { type: "Point", coordinates: [-120.71, 47.58] } },
  ],
};

describe("polygon documents (boulders / subareas)", () => {
  test("load presents closed LineStrings as Terra Draw polygons", () => {
    const feats = geo.documentToEditorFeatures("boulders", boulderDoc);
    expect(feats).toHaveLength(1);
    expect(feats[0].geometry.type).toBe("Polygon");
    expect(feats[0].properties.mode).toBe("polygon");
    // outer ring stays closed
    const ring = feats[0].geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  test("round-trip returns closed LineStrings with null properties, coords intact", () => {
    const feats = geo.documentToEditorFeatures("boulders", boulderDoc);
    const out = geo.editorFeaturesToDocument("boulders", feats);
    expect(out.type).toBe("FeatureCollection");
    expect(out.generator).toBe("cirque-admin");
    expect(out.features).toHaveLength(1);
    const f = out.features[0];
    expect(f.geometry.type).toBe("LineString");
    expect(f.properties).toBeNull();
    expect(f.geometry.coordinates).toEqual(boulderDoc.features[0].geometry.coordinates);
  });

  test("closes an open polygon ring on save", () => {
    const open = [
      { type: "Feature", properties: { mode: "polygon" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1]]] } },
    ];
    const out = geo.editorFeaturesToDocument("subareas", open);
    const ring = out.features[0].geometry.coordinates;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring).toHaveLength(4);
  });

  test("drops degenerate polygons (fewer than 3 vertices)", () => {
    const bad = [
      { type: "Feature", properties: { mode: "polygon" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [0, 0]]] } },
    ];
    expect(geo.editorFeaturesToDocument("boulders", bad).features).toHaveLength(0);
  });
});

describe("point documents (areas / subarea-centers)", () => {
  test("round-trips a point and preserves its name", () => {
    const feats = geo.documentToEditorFeatures("subarea-centers", pointDoc);
    expect(feats[0].geometry.type).toBe("Point");
    expect(feats[0].properties.name).toBe("Swiftwater");
    const out = geo.editorFeaturesToDocument("subarea-centers", feats);
    expect(out.features[0].properties).toEqual({ name: "Swiftwater" });
    expect(out.features[0].geometry.coordinates).toEqual([-120.71, 47.58]);
  });

  test("names an unnamed new point as empty string, not undefined", () => {
    const drawn = [{ type: "Feature", properties: { mode: "point" }, geometry: { type: "Point", coordinates: [-120.7, 47.5] } }];
    const out = geo.editorFeaturesToDocument("areas", drawn);
    expect(out.features[0].properties).toEqual({ name: "" });
  });
});

test("wrong geometry kind for the layer is ignored, not corrupted", () => {
  // A point sneaking into a polygon layer is dropped rather than written.
  const mixed = [
    { type: "Feature", properties: { mode: "point" }, geometry: { type: "Point", coordinates: [0, 0] } },
  ];
  expect(geo.editorFeaturesToDocument("boulders", mixed).features).toHaveLength(0);
});
