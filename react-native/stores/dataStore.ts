import { FeatureCollection, Point } from "geojson";
import { create } from "zustand";
import seed from "@/assets/seed.json";

/**
 * All app data from GET /v1/data (ADR 0001), normalized to app-side names.
 * Cloud document naming follows the geojson files: `subareas` = polygons,
 * `subarea-centers` = label points — the opposite of the legacy asset names.
 */
export type CirqueData = {
  problems: FeatureCollection<Point>;
  areas: FeatureCollection;
  boulders: FeatureCollection;
  subareaPolygons: FeatureCollection;
  subareaCenters: FeatureCollection;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePayload(payload: any): CirqueData | null {
  const docs = payload?.documents;
  const collections = {
    problems: payload?.problems,
    areas: docs?.areas,
    boulders: docs?.boulders,
    subareaPolygons: docs?.subareas,
    subareaCenters: docs?.["subarea-centers"],
  };
  for (const fc of Object.values(collections)) {
    if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) return null;
  }
  return collections as CirqueData;
}

type DataState = {
  data: CirqueData;
  etag: string | null;
  setData: (data: CirqueData, etag: string | null) => void;
};

const seedData = normalizePayload(seed);
if (!seedData) throw new Error("Bundled seed.json is malformed");

export const useDataStore = create<DataState>(set => ({
  data: seedData,
  etag: null,
  setData: (data, etag) => set({ data, etag }),
}));
