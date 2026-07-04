import { describe, expect, test } from "vitest";
import { deterministicId, insertSql } from "./importData.mjs";
import { featureToProblemRow } from "../src/problems.mjs";

const NOW = "2026-07-04T00:00:00.000Z";

const feature = {
  type: "Feature",
  properties: {
    name: "The Shallow",
    grade: "V0",
    subarea: "Forestland",
    topo: "forestland-cube-crack",
    order: "1",
    line: "[[315,278],[287,217]]",
    description: "Climb the tall face.",
    color: "black",
  },
  geometry: { type: "Point", coordinates: [-120.72892998547, 47.65451318915] },
};

describe("featureToProblemRow", () => {
  test("maps a full feature to a problems row", () => {
    const row = featureToProblemRow(feature, { id: "uuid-1", now: NOW, status: "approved" });
    expect(row).toEqual({
      id: "uuid-1",
      name: "The Shallow",
      grade: "V0",
      subarea: "Forestland",
      color: "black",
      sort_order: 1,
      description: "Climb the tall face.",
      lat: 47.65451318915,
      lng: -120.72892998547,
      line: "[[315,278],[287,217]]",
      topo_key: "topos/forestland-cube-crack",
      status: "approved",
      created_at: NOW,
      updated_at: NOW,
    });
  });

  test("maps missing optional properties to null", () => {
    const bare = {
      ...feature,
      properties: { name: "Bare", grade: "V1", subarea: "Forestland" },
    };
    const row = featureToProblemRow(bare, { id: "uuid-2", now: NOW });
    expect(row.topo_key).toBeNull();
    expect(row.sort_order).toBeNull();
    expect(row.line).toBeNull();
    expect(row.description).toBeNull();
    expect(row.color).toBeNull();
  });

  test("defaults status to pending (schema default; import passes approved)", () => {
    const row = featureToProblemRow(feature, { id: "uuid-4", now: NOW });
    expect(row.status).toBe("pending");
  });

  test("maps empty or non-numeric order to null, not 0 or NaN", () => {
    const withOrder = (order: unknown) =>
      featureToProblemRow(
        { ...feature, properties: { ...feature.properties, order } },
        { id: "x", now: NOW },
      ).sort_order;
    expect(withOrder("")).toBeNull();
    expect(withOrder("n/a")).toBeNull();
    expect(withOrder("0")).toBe(0);
  });
});

describe("deterministicId", () => {
  test("is stable for the same input and uuid-shaped", () => {
    const a = deterministicId("Forestland/The Shallow");
    expect(a).toBe(deterministicId("Forestland/The Shallow"));
    expect(a).not.toBe(deterministicId("Forestland/Other"));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe("insertSql", () => {
  test("escapes single quotes and renders nulls", () => {
    const sql = insertSql("problems", {
      id: "uuid-3",
      name: "Occum's Razor",
      description: null,
      sort_order: 2,
    });
    expect(sql).toBe(
      "INSERT OR REPLACE INTO problems (id, name, description, sort_order) VALUES ('uuid-3', 'Occum''s Razor', NULL, 2);",
    );
  });
});
