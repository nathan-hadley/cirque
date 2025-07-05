import React from "react";
import { ShapeSource, LineLayer } from "@rnmapbox/maps";
import { FeatureCollection, LineString, GeoJsonProperties } from "geojson";

type CircuitLinesLayerProps = {
  /**
   * Circuit lines data to display
   * Should be a FeatureCollection containing LineString features
   */
  circuitLines: FeatureCollection<LineString, GeoJsonProperties> | null;
  
  /**
   * Whether the circuit lines should be visible
   * @default true
   */
  visible?: boolean;
};

/**
 * CircuitLinesLayer component renders circuit lines on the map
 * 
 * Features:
 * - Displays dashed lines connecting problems in circuit order
 * - Color-coded based on circuit color property
 * - Conditional visibility based on current problem selection
 * - Zoom-dependent opacity and line width
 */
export function CircuitLinesLayer({ circuitLines, visible = true }: CircuitLinesLayerProps) {
  if (!circuitLines || !visible || circuitLines.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource id="circuit-lines-source" shape={circuitLines}>
      <LineLayer
        id="circuit-lines-layer"
        style={{
          lineColor: [
            "case",
            ["==", ["get", "color"], "red"],
            "#ff0000",
            ["==", ["get", "color"], "blue"],
            "#0000ff",
            ["==", ["get", "color"], "black"],
            "#000000",
            ["==", ["get", "color"], "white"],
            "#ffffff",
            ["==", ["get", "color"], "green"],
            "#00ff00",
            ["==", ["get", "color"], "yellow"],
            "#ffff00",
            "#888888", // default color
          ],
          lineWidth: ["interpolate", ["linear"], ["zoom"], 16, 2, 22, 4],
          lineDasharray: [2, 2],
          lineOpacity: [
            "step",
            ["zoom"],
            0, // hidden below zoom 16
            16,
            0.8, // visible at zoom 16+
          ],
        }}
      />
    </ShapeSource>
  );
}