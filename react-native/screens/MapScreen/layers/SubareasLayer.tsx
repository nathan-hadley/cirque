import { FillLayer, ShapeSource } from "@rnmapbox/maps";
import subareaPolygonsData from "@/assets/subareas-polygons";
import { LAYER_IDS, SOURCE_IDS, SUBAREA_COLORS } from "@/constants/map";

export function SubareasLayer() {
  return (
    <ShapeSource id={SOURCE_IDS.subareas} shape={subareaPolygonsData}>
      <FillLayer
        id={LAYER_IDS.subareaFill}
        style={{
          fillColor: SUBAREA_COLORS.fill,
          fillOpacity: [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.8, // 80% opacity at zoom 10 (more visible)
            12,
            0.6,
            14,
            0.4,
            15,
            0.2,
            16,
            0, // Hidden at zoom 16 and above
          ],
        }}
      />
    </ShapeSource>
  );
}
