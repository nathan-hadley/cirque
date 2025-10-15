import React from "react";
import { ShapeSource, LineLayer } from "@rnmapbox/maps";
import { FeatureCollection, LineString, GeoJsonProperties } from "geojson";

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
  circuitColor = "#3B82F6",
}: CircuitLineLayerProps) {
  if (!circuitLine || !visible || circuitLine.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource id="circuit-line-source" shape={circuitLine}>
      <LineLayer
        id="circuit-line-layer"
        belowLayerID="problems-layer"
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
