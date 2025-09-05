import { problemsData } from "@/assets/problems";
import { CircleLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { PROBLEM_COLORS } from "@/constants/map";
import { useProblemStore } from "@/stores/problemStore";
import { useMemo } from "react";

export function ProblemsLayer() {
  const { selectedGrades } = useProblemStore();

  const gradeFilter = useMemo(() => {
    if (selectedGrades.length === 0) {
      return undefined;
    }
    return ["in", ["get", "grade"], ["literal", selectedGrades]];
  }, [selectedGrades]);

  if (!problemsData) return null;

  const layerKey =
    selectedGrades.length === 0 ? "all-grades" : `filtered-${selectedGrades.join("-")}`;

  return (
    <ShapeSource id="problems-source" shape={problemsData}>
      <CircleLayer
        key={`${layerKey}-circle`}
        id="problems-layer"
        filter={gradeFilter}
        style={{
          circleRadius: ["interpolate", ["linear"], ["zoom"], 16, 3, 22, 20],
          circleColor: [
            "case",
            ["==", ["get", "color"], "red"],
            PROBLEM_COLORS.red,
            ["==", ["get", "color"], "blue"],
            PROBLEM_COLORS.blue,
            ["==", ["get", "color"], "black"],
            PROBLEM_COLORS.black,
            ["==", ["get", "color"], "white"],
            PROBLEM_COLORS.white,
            ["==", ["get", "color"], "green"],
            PROBLEM_COLORS.green,
            ["==", ["get", "color"], "yellow"],
            PROBLEM_COLORS.yellow,
            PROBLEM_COLORS.default,
          ],
          circleStrokeWidth: 0,
          circleOpacity: [
            "step",
            ["zoom"],
            0, // hidden below zoom 16
            16,
            1, // visible at zoom 16+
          ],
        }}
      />
      <SymbolLayer
        key={`${layerKey}-symbol`}
        id="problems-text-layer"
        filter={gradeFilter}
        style={{
          textField: ["get", "order"],
          textSize: ["interpolate", ["linear"], ["zoom"], 17, 8, 22, 26],
          textColor: [
            "case",
            ["==", ["get", "color"], "white"],
            PROBLEM_COLORS.blackText,
            PROBLEM_COLORS.defaultText,
          ],
          textFont: ["Open Sans Regular", "Arial Unicode MS Regular"],
          textAnchor: "center",
          textOffset: [0, 0],
          textIgnorePlacement: false,
          textOpacity: [
            "step",
            ["zoom"],
            0, // hidden below zoom 17
            17,
            1, // visible at zoom 17+
          ],
        }}
      />
    </ShapeSource>
  );
}
