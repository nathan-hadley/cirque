import areasData from "@/assets/areas";
import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";

export function AreaLabelsLayer() {
  return (
    <ShapeSource id="areas-source" shape={areasData}>
      <SymbolLayer
        id="area-labels-layer"
        style={{
          textField: ["to-string", ["get", "name"]],
          textFont: ["Open Sans Regular"],
          textSize: 16, // Fixed 14px size, no scaling
          textColor: "#000000",
          textHaloColor: "#FFFFFF",
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
          textTransform: "none",
          textLetterSpacing: 0.5,
          textLineHeight: 1.2,
          textMaxWidth: 10, 
          textJustify: "center",
          textAnchor: "center",
          textAllowOverlap: false,
          textIgnorePlacement: false,
          symbolPlacement: "line", // Place labels along the line
          textRotationAlignment: "map", // Rotate with the line
          textPitchAlignment: "viewport", // Keep text readable
          symbolSpacing: 300, // Space between repeated labels on long lines
          textMaxAngle: 45, // Maximum angle change for curved text
          symbolSortKey: 0, // Lower priority than subarea labels
        }}
      />
    </ShapeSource>
  );
}
