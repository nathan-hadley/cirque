import React from "react";
import { ShapeSource, LineLayer } from "@rnmapbox/maps";
import { FeatureCollection, LineString, GeoJsonProperties } from "geojson";

type CircuitLinesLayerProps = {
  /**
   * Circuit line data to display
   * Should be a FeatureCollection containing LineString features
   */
  circuitLine: FeatureCollection<LineString, GeoJsonProperties> | null;
  
  /**
   * Whether the circuit line should be visible
   * @default true
   */
  visible?: boolean;

  /**
   * Color of the selected problem's circuit
   * Used to style the circuit line to match
   */
  circuitColor?: string;
};

/**
 * CircuitLinesLayer component renders dashed circuit line on the map
 * 
 * Features:
 * - Displays dashed line connecting problems in circuit order
 * - Color-coded based on selected problem's circuit color
 * - Conditional visibility based on current problem selection
 * - Zoom-dependent opacity and line width
 * - Only shows line for the currently selected problem's circuit
 */
export function CircuitLinesLayer({ 
  circuitLine, 
  visible = true, 
  circuitColor = "#3B82F6" 
}: CircuitLinesLayerProps) {
  if (!circuitLine || !visible || circuitLine.features.length === 0) {
    return null;
  }

  return (
    <ShapeSource id="circuit-line-source" shape={circuitLine}>
      <LineLayer
        id="circuit-line-layer"
        style={{
          lineColor: circuitColor,
          lineWidth: [
            "interpolate",
            ["linear"],
            ["zoom"],
            16, 2,    // 2px at zoom 16
            22, 4     // 4px at zoom 22
          ],
          lineDasharray: [2, 2], // Dashed line pattern
          lineOpacity: [
            "step",
            ["zoom"],
            0,    // hidden below zoom 16
            16, 0.8,  // 80% opacity at zoom 16+
            18, 1.0   // 100% opacity at zoom 18+
          ],
          lineCap: "round",
          lineJoin: "round"
        }}
      />
    </ShapeSource>
  );
}