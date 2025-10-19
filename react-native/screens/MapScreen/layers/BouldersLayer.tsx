import { FillLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
import bouldersData from "@/assets/boulders";
import { BOULDER_COLORS, LAYER_IDS, SOURCE_IDS } from "@/constants/map";

export function BouldersLayer() {
  return (
    <ShapeSource id={SOURCE_IDS.boulders} shape={bouldersData}>
      <FillLayer
        id={LAYER_IDS.bouldersFill}
        style={{
          fillColor: BOULDER_COLORS.fill,
        }}
      />
      <LineLayer
        id={LAYER_IDS.boulders}
        style={{
          lineColor: BOULDER_COLORS.line,
          lineWidth: 1,
        }}
      />
    </ShapeSource>
  );
}
