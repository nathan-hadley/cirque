import { CircleLayer, ShapeSource } from "@rnmapbox/maps";
import { useProblemStore } from "@/stores/problemStore";
import { SELECTED_PROBLEM_COLORS } from "@/constants/map";

export function SelectedProblemLayer() {
  const { problem, viewProblem } = useProblemStore();

  if (!problem || !viewProblem || !problem.coordinates) return null;

  return (
    <ShapeSource
      id="selected-problem-source"
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
        id="selected-problem-indicator"
        style={{
          circleRadius: ["interpolate", ["linear"], ["zoom"], 16, 3, 22, 20],
          circleColor: "transparent",
          circleStrokeColor: SELECTED_PROBLEM_COLORS.stroke,
          circleStrokeWidth: ["interpolate", ["linear"], ["zoom"], 16, 2, 22, 3],
          circleStrokeOpacity: [
            "step",
            ["zoom"],
            0, // hidden below zoom 16
            18,
            1, // visible at zoom 16+
          ],
        }}
      />
    </ShapeSource>
  );
}
