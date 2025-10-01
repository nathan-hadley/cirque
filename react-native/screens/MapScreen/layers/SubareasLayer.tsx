import subareaPolygonsData from "@/assets/subareas-polygons";
import { ShapeSource, FillLayer } from "@rnmapbox/maps";

export function SubareasLayer() {
  return (
    <ShapeSource id="subarea-polygons-source" shape={subareaPolygonsData}>
      <FillLayer
        id="subarea-fill-layer"
        style={{
          fillColor: "#808080", // Grey color
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
