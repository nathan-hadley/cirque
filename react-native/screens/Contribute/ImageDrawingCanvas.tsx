import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

export type NormalizedPoint = [number, number];

export type ImageDrawingCanvasProps = {
  onChangePoints?: (points: NormalizedPoint[]) => void;
  // When this value changes, the internal points are cleared
  resetKey?: string | number;
};

// Utility to clamp a value into a range
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const STROKE_COLOR = "#ff3333";
const STROKE_WIDTH = 3;

export function ImageDrawingCanvas({ onChangePoints, resetKey }: ImageDrawingCanvasProps) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const [points, setPoints] = useState<NormalizedPoint[]>([]);

  const layoutRef = useRef<{ width: number; height: number } | null>(null);
  const onChangePointsRef = useRef<ImageDrawingCanvasProps["onChangePoints"]>();

  useEffect(() => {
    onChangePointsRef.current = onChangePoints;
  }, [onChangePoints]);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    const next = { width, height };
    layoutRef.current = next;
    setLayout(next);
  }

  // Touch handling using PanResponder to avoid extra dependencies
  const drawing = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        drawing.current = true;
        const { locationX, locationY } = evt.nativeEvent;
        setPoints([]);
        const layoutNow = layoutRef.current;
        if (!layoutNow) return;
        const clampedX = clamp(locationX, 0, layoutNow.width);
        const clampedY = clamp(locationY, 0, layoutNow.height);
        const normX = layoutNow.width === 0 ? 0 : clampedX / layoutNow.width;
        const normY = layoutNow.height === 0 ? 0 : clampedY / layoutNow.height;
        setPoints((prev) => {
          const next = [...prev, [normX, normY]] as NormalizedPoint[];
          onChangePointsRef.current?.(next);
          return next;
        });
      },
      onPanResponderMove: (evt) => {
        if (!drawing.current) return;
        const layoutNow = layoutRef.current;
        if (!layoutNow) return;
        const { locationX, locationY } = evt.nativeEvent;
        const clampedX = clamp(locationX, 0, layoutNow.width);
        const clampedY = clamp(locationY, 0, layoutNow.height);
        const normX = layoutNow.width === 0 ? 0 : clampedX / layoutNow.width;
        const normY = layoutNow.height === 0 ? 0 : clampedY / layoutNow.height;
        setPoints((prev) => {
          const next = [...prev, [normX, normY]] as NormalizedPoint[];
          onChangePointsRef.current?.(next);
          return next;
        });
      },
      onPanResponderRelease: () => {
        drawing.current = false;
      },
      onPanResponderTerminate: () => {
        drawing.current = false;
      },
    })
  ).current;

  // Create path string from normalized points scaled to current layout
  const screenPoints: number[][] = !layout
    ? []
    : points.map(([nx, ny]) => [nx * layout.width, ny * layout.height]);

  let pathData = "";
  if (screenPoints.length > 0) {
    pathData = `M ${screenPoints[0][0]} ${screenPoints[0][1]}`;
    for (let i = 1; i < screenPoints.length; i++) {
      const prev = screenPoints[i - 1];
      const curr = screenPoints[i];
      const midX = (prev[0] + curr[0]) / 2;
      const midY = (prev[1] + curr[1]) / 2;
      pathData += ` Q ${prev[0]} ${prev[1]} ${midX} ${midY}`;
    }
    if (screenPoints.length > 1) {
      const last = screenPoints[screenPoints.length - 1];
      pathData += ` L ${last[0]} ${last[1]}`;
    }
  }

  const startPoint = screenPoints.length > 0 ? screenPoints[0] : null;

  // External reset
  useEffect(() => {
    setPoints([]);
    onChangePointsRef.current?.([]);
  }, [resetKey]);

  return (
    <View style={styles.container} onLayout={handleLayout} {...panResponder.panHandlers}>
      {/* The parent should render the image behind this component. This overlay captures gestures. */}
      {layout && (
        <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill}>
          {pathData !== "" && (
            <Path
              d={pathData}
              stroke={STROKE_COLOR}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.9}
            />
          )}
          {startPoint && <Circle cx={startPoint[0]} cy={startPoint[1]} r={6} fill={STROKE_COLOR} opacity={0.9} />}
        </Svg>
      )}

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
