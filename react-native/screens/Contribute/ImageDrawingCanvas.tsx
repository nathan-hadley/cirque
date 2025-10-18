import React, { useCallback, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

export type NormalizedPoint = [number, number];

export type ImageDrawingCanvasProps = {
  imageUri: string; // Image rendered behind the canvas by parent
  imageNaturalSize: { width: number; height: number } | null; // original dimensions
  strokeColor?: string;
  strokeWidth?: number;
  // Callbacks
  onChangePoints?: (points: NormalizedPoint[]) => void;
  onClear?: () => void;
  // When this value changes, the internal points are cleared
  resetKey?: string | number;
};

// Utility to clamp a value into a range
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function ImageDrawingCanvas({
  imageUri,
  imageNaturalSize,
  strokeColor = "#ff3333",
  strokeWidth = 3,
  onChangePoints,
  onClear,
  resetKey,
}: ImageDrawingCanvasProps) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [points, setPoints] = useState<NormalizedPoint[]>([]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  // Touch handling using PanResponder to avoid extra dependencies
  const drawing = useRef(false);

  const addPoint = useCallback(
    (x: number, y: number) => {
      if (!layout) return;
      const clampedX = clamp(x, 0, layout.width);
      const clampedY = clamp(y, 0, layout.height);
      const normX = layout.width === 0 ? 0 : clampedX / layout.width;
      const normY = layout.height === 0 ? 0 : clampedY / layout.height;
      setPoints((prev) => {
        const next = [...prev, [normX, normY]] as NormalizedPoint[];
        onChangePoints?.(next);
        return next;
      });
    },
    [layout, onChangePoints]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          drawing.current = true;
          const { locationX, locationY } = evt.nativeEvent;
          setPoints([]);
          addPoint(locationX, locationY);
        },
        onPanResponderMove: (evt) => {
          if (!drawing.current) return;
          const { locationX, locationY } = evt.nativeEvent;
          addPoint(locationX, locationY);
        },
        onPanResponderRelease: () => {
          drawing.current = false;
        },
        onPanResponderTerminate: () => {
          drawing.current = false;
        },
      }),
    [addPoint]
  );

  // Create path string from normalized points scaled to current layout
  const screenPoints = useMemo(() => {
    if (!layout) return [] as number[][];
    return points.map(([nx, ny]) => [nx * layout.width, ny * layout.height]);
  }, [points, layout]);

  const pathData = useMemo(() => {
    if (screenPoints.length === 0) return "";
    let path = `M ${screenPoints[0][0]} ${screenPoints[0][1]}`;
    for (let i = 1; i < screenPoints.length; i++) {
      const prev = screenPoints[i - 1];
      const curr = screenPoints[i];
      const midX = (prev[0] + curr[0]) / 2;
      const midY = (prev[1] + curr[1]) / 2;
      path += ` Q ${prev[0]} ${prev[1]} ${midX} ${midY}`;
    }
    if (screenPoints.length > 1) {
      const last = screenPoints[screenPoints.length - 1];
      path += ` L ${last[0]} ${last[1]}`;
    }
    return path;
  }, [screenPoints]);

  const startPoint = screenPoints.length > 0 ? screenPoints[0] : null;

  const handleClear = useCallback(() => {
    setPoints([]);
    onChangePoints?.([]);
    onClear?.();
  }, [onChangePoints, onClear]);

  // External reset
  React.useEffect(() => {
    setPoints([]);
    onChangePoints?.([]);
  }, [resetKey, onChangePoints]);

  return (
    <View style={styles.container} onLayout={handleLayout} {...panResponder.panHandlers}>
      {/* The parent should render the image behind this component. This overlay captures gestures. */}
      {layout && (
        <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill}>
          {pathData !== "" && (
            <Path
              d={pathData}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.9}
            />
          )}
          {startPoint && <Circle cx={startPoint[0]} cy={startPoint[1]} r={6} fill={strokeColor} opacity={0.9} />}
        </Svg>
      )}

      {/* Add simple clear area/button overlay instructions via parent; we just expose handleClear */}
      {/* This component focuses on drawing and exposing normalized points. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export function denormalizePoints(
  normalized: NormalizedPoint[],
  target: { width: number; height: number }
): number[][] {
  return normalized.map(([nx, ny]) => [nx * target.width, ny * target.height]);
}

export function normalizePoints(
  points: number[][],
  source: { width: number; height: number }
): NormalizedPoint[] {
  return points.map(([x, y]) => [x / source.width, y / source.height]);
}

export function clearPointsSetter(setter: (pts: NormalizedPoint[]) => void) {
  return () => setter([]);
}
