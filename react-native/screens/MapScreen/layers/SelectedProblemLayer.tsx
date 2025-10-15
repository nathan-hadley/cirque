import { CircleLayer, ShapeSource } from "@rnmapbox/maps";
import { useProblemStore } from "@/stores/problemStore";
import { SELECTED_PROBLEM_COLORS, LAYER_IDS, SOURCE_IDS } from "@/constants/map";

export function SelectedProblemLayer() {
  const { problem, viewProblem } = useProblemStore();

  if (!problem || !viewProblem || !problem.coordinates) return null;

  return (
    <ShapeSource
      id={SOURCE_IDS.selectedProblem}
      shape={{
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: problem.coordinates,
        },
        properties: {},
      }}
    >
      <CircleLayer
        id={LAYER_IDS.selectedProblem}
        style={{
          circleRadius: ["interpolate", ["linear"], ["zoom"], 16, 3, 22, 20],
          circleColor: "transparent",
          circleStrokeColor: SELECTED_PROBLEM_COLORS.stroke,
          circleStrokeWidth: ["interpolate", ["linear"], ["zoom"], 16, 2, 22, 3],
          circleStrokeOpacity: [
            "step",
            ["zoom"],
            0, // hidden below zoom 18
            18,
            1, // visible at zoom 18+
          ],
        }}
      />
    </ShapeSource>
  );
}
