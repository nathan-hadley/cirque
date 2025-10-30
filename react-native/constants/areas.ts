// Leavenworth climbing areas
// Derived from subareas GeoJSON data
import { subareasData } from "@/assets/subareas";

export const LEAVENWORTH_AREAS = subareasData.features
  .map(f => f.properties?.name)
  .filter((name): name is string => typeof name === "string")
  .sort() as readonly string[];

export type LeavenworthArea = (typeof LEAVENWORTH_AREAS)[number];
