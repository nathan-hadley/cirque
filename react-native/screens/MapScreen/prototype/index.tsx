// PROTOTYPE (#74): Sender takes on Map + ProblemSheet on the real map route.
// Switch with the purple bar or `cirque://?v=A|B|D|E|F&p=auto` (p=auto opens a circuit problem with a topo, or pass a problem id).
import { useEffect, useRef } from "react";
import { useColorScheme } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { MAX_GRADE, MIN_GRADE } from "@/models/problems";
import { useDataStore } from "@/stores/dataStore";
import { useMapStore } from "@/stores/mapStore";
import { useProblemStore } from "@/stores/problemStore";
import { MAP_STYLE } from "./sender";
import type { VariantProps } from "./types";
import { VariantFaithful } from "./VariantFaithful";
import { VariantMix } from "./VariantMix";
import { VariantPlate } from "./VariantPlate";
import { VariantPoster } from "./VariantPoster";
import { VariantRoute } from "./VariantRoute";
import { VariantStacked } from "./VariantStacked";
import type { VariantKey } from "./PrototypeSwitcher";

export { CORAL } from "./sender";
export { PrototypeSwitcher, toVariant, type VariantKey } from "./PrototypeSwitcher";
export { PrototypeSelectedLayer } from "./SelectedHighlight";

export function usePrototypeMapStyle(variant: VariantKey, fallback: string) {
  const scheme = useColorScheme();
  if (variant === "stock") return fallback;
  return scheme === "dark" ? MAP_STYLE.dark : MAP_STYLE.light;
}

export function useAutoOpenProblem(p: string | undefined) {
  const problems = useDataStore(s => s.data.problems);
  const opened = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!p || opened.current === p || !problems?.features.length) return;
    const feature =
      p === "auto"
        ? problems.features.find(
            f => f.properties?.topoKey && Number(f.properties?.order) === 3 && f.properties?.description
          )
        : problems.features.find(f => String(f.properties?.id) === p);
    if (!feature) return;
    const { createProblemFromMapFeature, setProblem, setViewProblem } = useProblemStore.getState();
    const problem = createProblemFromMapFeature(feature);
    if (!problem) return;
    const first = opened.current === undefined;
    opened.current = p;
    setProblem(problem);
    setViewProblem(true);
    const coords = problem.coordinates;
    if (coords) setTimeout(() => useMapStore.getState().flyToProblemCoordinates(coords), first ? 1500 : 0);
  }, [p, problems]);
}

export function PrototypeChrome({
  variant,
  ...props
}: Omit<VariantProps, "filtered" | "gradeRange"> & { variant: Exclude<VariantKey, "stock"> }) {
  const minGrade = useProblemStore(s => s.minGrade);
  const maxGrade = useProblemStore(s => s.maxGrade);
  const { f } = useGlobalSearchParams<{ f?: string }>();

  useEffect(() => {
    if (f === undefined) return;
    const [lo, hi] = f === "all" ? [MIN_GRADE, MAX_GRADE] : f.split("-").map(Number);
    const { setMinGrade, setMaxGrade } = useProblemStore.getState();
    setMinGrade(lo);
    setMaxGrade(hi);
  }, [f]);

  const filtered = minGrade !== MIN_GRADE || maxGrade !== MAX_GRADE;
  const gradeRange = !filtered ? "All grades" : minGrade === maxGrade ? `V${minGrade} only` : `V${minGrade} to V${maxGrade}`;
  const all = { ...props, filtered, gradeRange };

  if (variant === "A") return <VariantFaithful {...all} />;
  if (variant === "B") return <VariantPoster {...all} />;
  if (variant === "D") return <VariantPlate {...all} />;
  if (variant === "E") return <VariantStacked {...all} />;
  if (variant === "F") return <VariantRoute {...all} />;
  return <VariantMix {...all} />;
}
