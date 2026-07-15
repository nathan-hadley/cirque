// Leavenworth climbing areas, derived from the subarea label points
// (cloud document "subarea-centers") in the current dataset.
import { CirqueData } from "@/stores/dataStore";

export function leavenworthAreas(data: CirqueData): string[] {
  return [...new Set(data.subareaCenters.features.map(f => f.properties?.name))]
    .filter((name): name is string => typeof name === "string")
    .sort();
}

export type LeavenworthArea = string;
