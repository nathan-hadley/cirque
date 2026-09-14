// PROTOTYPE (#74): selected-problem ring options on the map. Pick with `h=coral|gap|ink|swap`.
import { CircleLayer, ShapeSource } from "@rnmapbox/maps";
import { useGlobalSearchParams } from "expo-router";
import { LAYER_IDS, SOURCE_IDS } from "@/constants/map";
import { useProblemStore } from "@/stores/problemStore";
import { CORAL, useSender } from "./sender";

export const HIGHLIGHTS = [
  { key: "coral", name: "Coral" },
  { key: "gap", name: "Coral+gap" },
  { key: "ink", name: "Ink+gap" },
  { key: "swap", name: "Ink on red" },
] as const;

export type HighlightKey = (typeof HIGHLIGHTS)[number]["key"];

export function toHighlight(h: string | undefined): HighlightKey {
  return HIGHLIGHTS.find(x => x.key === h)?.key ?? "coral";
}

export function PrototypeSelectedLayer() {
  const t = useSender();
  const { h } = useGlobalSearchParams<{ h?: string }>();
  const mode = toHighlight(h);
  const { problem, viewProblem } = useProblemStore();

  if (!problem || !viewProblem || !problem.coordinates) return null;

  const gapped = mode !== "coral";
  const ringColor = mode === "ink" || (mode === "swap" && problem.colorStr === "red") ? t.ink : CORAL;
  const gapColor = t.scheme === "dark" ? "#111110" : "#FFFFFF";

  return (
    <ShapeSource
      id={SOURCE_IDS.selectedProblem}
      shape={{ type: "Feature", geometry: { type: "Point", coordinates: problem.coordinates }, properties: {} }}
    >
      <CircleLayer
        id={`${LAYER_IDS.selectedProblem}-gap`}
        style={{
          circleRadius: ["interpolate", ["linear"], ["zoom"], 16, 3, 22, 20],
          circleColor: "transparent",
          circleStrokeColor: gapColor,
          circleStrokeWidth: ["interpolate", ["linear"], ["zoom"], 16, 1, 22, 3],
          circleStrokeOpacity: ["step", ["zoom"], 0, 18, gapped ? 1 : 0],
        }}
      />
      <CircleLayer
        id={LAYER_IDS.selectedProblem}
        style={{
          circleRadius: gapped
            ? ["interpolate", ["linear"], ["zoom"], 16, 4, 22, 23]
            : ["interpolate", ["linear"], ["zoom"], 16, 3, 22, 20],
          circleColor: "transparent",
          circleStrokeColor: ringColor,
          circleStrokeWidth: ["interpolate", ["linear"], ["zoom"], 16, 2, 22, 3.5],
          circleStrokeOpacity: ["step", ["zoom"], 0, 18, 1],
        }}
      />
    </ShapeSource>
  );
}
