import subareasData from "@/assets/subareas";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";

export function SubareaLabelsLayer() {
  return (
    <ShapeSource id="subareas-source" shape={subareasData}>
      <SymbolLayer
        id="subarea-labels-layer"
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
          textColor: "#000000",
          textHaloColor: "#FFFFFF",
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
          textJustify: "center",
          textAnchor: "center",
          textAllowOverlap: false,
          textIgnorePlacement: false,
          symbolPlacement: "point",
          symbolSortKey: 1,
        }}
      />
    </ShapeSource>
  );
}
