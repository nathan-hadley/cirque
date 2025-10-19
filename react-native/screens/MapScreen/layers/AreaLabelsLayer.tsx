import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import areasData from "@/assets/areas";
import { LAYER_IDS, PROBLEM_COLORS, SOURCE_IDS } from "@/constants/map";

export function AreaLabelsLayer() {
  return (
    <ShapeSource id={SOURCE_IDS.areaLabels} shape={areasData}>
      <SymbolLayer
        id={LAYER_IDS.areaLabels}
        style={{
          textField: ["to-string", ["get", "name"]],
          textFont: ["Open Sans Regular"],
          textSize: 16, // Fixed 16px size, no scaling
          textColor: PROBLEM_COLORS.blackText,
          textHaloColor: PROBLEM_COLORS.white,
          textHaloWidth: 2,
          textHaloBlur: 1,
          textOpacity: [
            "step",
            ["zoom"],
            0, // Hidden below zoom 10
            8,
            1,
            12,
            0, // Hidden at zoom 12 and above
          ],
          textLetterSpacing: 0.5,
          textLineHeight: 1.2,
          symbolSortKey: 0, // Lower priority than subarea labels
        }}
      />
    </ShapeSource>
  );
}
