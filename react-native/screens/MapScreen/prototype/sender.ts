// PROTOTYPE (#74): throwaway Sender tokens for the Map + ProblemSheet mocks. Not the real theme.
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { mapProblemService } from "@/services/mapProblemService";
import { useDataStore } from "@/stores/dataStore";
import { useProblemStore } from "@/stores/problemStore";

export const CORAL = "#FF4D3D";

const light = {
  scheme: "light" as "light" | "dark",
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  ink: "#111110",
  muted: "#5B5A55",
  faint: "#8C8B85",
  line: "rgba(17,17,16,0.14)",
  accent: CORAL,
  onAccent: "#FFFFFF",
  inkFill: "#111110",
  onInkFill: "#F4F3EF",
};

const dark: typeof light = {
  scheme: "dark",
  bg: "#111110",
  surface: "#1C1C1A",
  ink: "#F4F3EF",
  muted: "#A3A29C",
  faint: "#6E6D68",
  line: "rgba(244,243,239,0.16)",
  accent: CORAL,
  onAccent: "#FFFFFF",
  inkFill: "#F4F3EF",
  onInkFill: "#111110",
};

export type SenderTokens = typeof light;

export function useSender(): SenderTokens {
  return useColorScheme() === "dark" ? dark : light;
}

export const RADIUS = 6;

export const heading = {
  fontWeight: "800",
  letterSpacing: -0.6,
  textTransform: "uppercase",
} as const;

export const label = {
  fontWeight: "700",
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: "uppercase",
} as const;

// Stand-in only: the real dark basemap is #79's call.
export const MAP_STYLE = {
  light: "mapbox://styles/mapbox/outdoors-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
};

export function useCircuitNav() {
  "use no memo";
  const problem = useProblemStore(s => s.problem);
  useProblemStore(s => s.minGrade);
  useProblemStore(s => s.maxGrade);
  useDataStore(s => s.data.problems);

  const list =
    problem?.subarea && problem.order !== undefined
      ? useProblemStore.getState().getVisibleProblemsInCircuit(problem.colorStr, problem.subarea)
      : [];
  const index = list.findIndex(p => p.order === problem?.order);

  function go(direction: "prev" | "next") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === "prev") mapProblemService.showPreviousProblem();
    else mapProblemService.showNextProblem();
  }

  return {
    index,
    total: list.length,
    canPrev: index > 0,
    canNext: index >= 0 && index < list.length - 1,
    prev: () => go("prev"),
    next: () => go("next"),
  };
}

export function circuitName(colorStr: string) {
  return colorStr ? `${colorStr} circuit` : "No circuit";
}

export function pad(n: number | undefined) {
  return n === undefined ? "--" : String(n).padStart(2, "0");
}
