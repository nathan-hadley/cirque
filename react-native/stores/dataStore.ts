import { FeatureCollection, Point } from "geojson";
import { create } from "zustand";
import seed from "@/assets/seed.json";

/** All app data from GET /v1/data (ADR 0001), normalized to app-side names. */
export type CirqueData = {
  problems: FeatureCollection<Point>;
  areas: FeatureCollection;
  boulders: FeatureCollection;
  subareaPolygons: FeatureCollection;
  subareaCenters: FeatureCollection;
};

function isFeatureCollection(fc: unknown): fc is FeatureCollection {
  return (
    typeof fc === "object" &&
    fc !== null &&
    (fc as FeatureCollection).type === "FeatureCollection" &&
    Array.isArray((fc as FeatureCollection).features)
  );
}

export function normalizePayload(payload: unknown): CirqueData | null {
  const root = payload as { problems?: unknown; documents?: Record<string, unknown> } | null;
  const docs = root?.documents;
  const collections = {
    problems: root?.problems,
    areas: docs?.areas,
    boulders: docs?.boulders,
    subareaPolygons: docs?.subareas,
    subareaCenters: docs?.["subarea-centers"],
  };
  for (const fc of Object.values(collections)) {
    if (!isFeatureCollection(fc)) return null;
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
