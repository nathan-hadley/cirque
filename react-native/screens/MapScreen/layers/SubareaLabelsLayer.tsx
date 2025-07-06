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
            18,
            16, // 16px at zoom 18
            22,
            20, // 20px at zoom 22
          ],
          textColor: "#2D3748",
          textHaloColor: "#FFFFFF",
          textHaloWidth: 2,
          textHaloBlur: 1,
          textOpacity: [
            "step",
            ["zoom"],
            0, // hidden below zoom 14
            14,
            0.8, // 80% opacity at zoom 14+
            16,
            1.0, // 100% opacity at zoom 16+
          ],
          textTransform: "uppercase",
          textLetterSpacing: 0.1,
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
