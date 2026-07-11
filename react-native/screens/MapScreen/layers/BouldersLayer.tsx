import { FillLayer, LineLayer, ShapeSource } from "@rnmapbox/maps";
import { BOULDER_COLORS, LAYER_IDS, SOURCE_IDS } from "@/constants/map";
import { useDataStore } from "@/stores/dataStore";

export function BouldersLayer() {
  const bouldersData = useDataStore(s => s.data.boulders);
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
