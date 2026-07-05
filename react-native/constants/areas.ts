// Leavenworth climbing areas, derived from the subarea label points
// (cloud document "subarea-centers") in the bundled/cached dataset.
import { useDataStore } from "@/stores/dataStore";

export const LEAVENWORTH_AREAS = useDataStore
  .getState()
  .data.subareaCenters.features.map(f => f.properties?.name)
  .filter((name): name is string => typeof name === "string")
  .sort() as readonly string[];

export type LeavenworthArea = (typeof LEAVENWORTH_AREAS)[number];
