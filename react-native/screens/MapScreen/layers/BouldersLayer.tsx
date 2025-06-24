import bouldersData from "@/assets/boulders";
import { FillLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
import { BOULDER_COLORS } from "@/constants/map";

export function BouldersLayer() {
  return (
    <ShapeSource id="boulders-source" shape={bouldersData}>
      <FillLayer
        id="boulders-fill-layer"
        style={{
          fillColor: BOULDER_COLORS.fill,
        }}
      />
      <LineLayer
        id="boulders-layer"
        style={{
          lineColor: BOULDER_COLORS.line,
          lineWidth: 1,
        }}
      />
    </ShapeSource>
  );
}