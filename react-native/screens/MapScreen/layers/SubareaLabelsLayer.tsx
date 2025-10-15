import subareasData from "@/assets/subareas";
import { PROBLEM_COLORS, LAYER_IDS, SOURCE_IDS } from "@/constants/map";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";

export function SubareaLabelsLayer() {
  return (
    <ShapeSource id={SOURCE_IDS.subareaLabels} shape={subareasData}>
      <SymbolLayer
        id={LAYER_IDS.subareaLabels}
        style={{
          textField: ["get", "name"],
          textFont: ["Arial Unicode MS Bold"],
          textSize: [
            "interpolate",
            ["linear"],
            ["zoom"],
            14,
            12, // 12px at zoom 14
            16,
            16, // 16px at zoom 16
          ],
          textColor: PROBLEM_COLORS.blackText,
          textHaloColor: PROBLEM_COLORS.white,
          textHaloWidth: 1,
          textHaloBlur: 1,
          textOpacity: [
            "step",
            ["zoom"],
            0, // Hidden below zoom 11
            11,
            1,
            16,
            0, // Hidden at zoom 16 and above
          ],
          textLetterSpacing: 0.2,
          symbolSortKey: 1,
        }}
      />
    </ShapeSource>
  );
}
