import { CircleLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { problemsData } from "@/assets/problems";
import { LAYER_IDS, PROBLEM_COLORS, SOURCE_IDS } from "@/constants/map";
import { useProblemStore } from "@/stores/problemStore";

type MapboxFilter = ["in", ["get", string], ["literal", string[]]] | undefined;

export function ProblemsLayer() {
  const { minGrade, maxGrade } = useProblemStore();

  const gradeFilter = (): MapboxFilter => {
    if (minGrade === 0 && maxGrade === 10) {
      return undefined;
    }

    const gradeList: string[] = [];
    for (let i = minGrade; i <= maxGrade; i++) {
      gradeList.push(`V${i}`);
    }

    return ["in", ["get", "grade"], ["literal", gradeList]];
  };

  if (!problemsData) return null;

  const layerKey =
    minGrade === 0 && maxGrade === 10 ? "all-grades" : `filtered-${minGrade}-${maxGrade}`;

  return (
    <ShapeSource key={layerKey} id={`${SOURCE_IDS.problems}-${layerKey}`} shape={problemsData}>
      <CircleLayer
        id={LAYER_IDS.problems}
        filter={gradeFilter()}
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
        id={LAYER_IDS.problemsText}
        filter={gradeFilter()}
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
          textIgnorePlacement: true,
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
