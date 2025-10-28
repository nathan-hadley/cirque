import { useState } from "react";
import type { Feature, GeoJsonProperties, Point } from "geojson";
import { problemsData } from "@/assets/problems";

type ProblemFeature = Feature<Point, GeoJsonProperties>;

/**
 * Hook that returns all problems sorted alphabetically by name
 * Computed once on mount to avoid flickering
 */
export function useProblems() {
  const [sortedProblems] = useState(() => {
    return [...problemsData.features].sort((a, b) => {
      const nameA = (a.properties?.name || "").toLowerCase();
      const nameB = (b.properties?.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  });

  return sortedProblems;
}

/**
 * Hook to search problems by query
 */
export function useSearchProblems(query: string): ProblemFeature[] {
  const allProblems = useProblems();

  if (!query.trim()) return allProblems;

  const lowerQuery = query.toLowerCase();
  return allProblems.filter(feature => {
    const searchText =
      `${feature.properties?.name} ${feature.properties?.grade} ${feature.properties?.subarea}`.toLowerCase();
    return searchText.includes(lowerQuery);
  });
}
