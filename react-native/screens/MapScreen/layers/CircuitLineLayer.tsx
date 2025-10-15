import React from "react";
import { ShapeSource, LineLayer } from "@rnmapbox/maps";
import { FeatureCollection, LineString, GeoJsonProperties } from "geojson";
import { LAYER_IDS, SOURCE_IDS, PROBLEM_COLORS } from "@/constants/map";

type CircuitLineLayerProps = {
  circuitLine: FeatureCollection<LineString, GeoJsonProperties> | null;
  visible?: boolean;
  circuitColor?: string;
};

/**
 * CircuitLineLayer component renders dashed circuit line on the map
 *
 * Features:
 * - Displays dashed line connecting problems in circuit order
 * - Color-coded based on selected problem's circuit color
 * - Conditional visibility based on current problem selection
 * - Zoom-dependent opacity and line width
 * - Only shows line for the currently selected problem's circuit
 */
export function CircuitLineLayer({
  circuitLine,
  visible = true,
  circuitColor = PROBLEM_COLORS.default,
}: CircuitLineLayerProps) {
  if (!circuitLine || !visible || circuitLine.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource id={SOURCE_IDS.circuitLine} shape={circuitLine}>
      <LineLayer
        id={LAYER_IDS.circuitLine}
        belowLayerID={LAYER_IDS.problems}
        style={{
          lineColor: circuitColor,
          lineWidth: [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0, // 0px at zoom 15
            16,
            2, // 2px at zoom 16
            22,
            4, // 4px at zoom 22
          ],
          lineDasharray: [2, 2], // Dashed line pattern
          lineOpacity: 0.5,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </ShapeSource>
  );
}
