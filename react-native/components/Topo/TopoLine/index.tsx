import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { createPath, estimatePathLength, getScaledPoints } from "./topoLineUtil";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type TopoLineProps = {
  line: number[][]; // Pixel coordinates (640×480)
  color?: string;
  originalImageSize: { width: number; height: number };
  displayedImageSize: { width: number; height: number };
};

export function TopoLine({
  line,
  color = "#ff3333",
  originalImageSize,
  displayedImageSize,
}: TopoLineProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (line && line.length > 0) {
      progress.value = 0;
      progress.value = withDelay(500, withTiming(1, { duration: 500 }));
    }
  }, [progress, line]);

  // Calculate values needed for animation (will be empty if no line)
  const scaledPoints =
    line && line.length > 0
      ? getScaledPoints({
          originalImageSize,
          displayedImageSize,
          line,
        })
      : [];
  const pathData = scaledPoints.length > 0 ? createPath(scaledPoints) : "";
  const pathLength = scaledPoints.length > 0 ? estimatePathLength(scaledPoints) : 0;
  const startPoint = scaledPoints.length > 0 ? scaledPoints[0] : [0, 0];

  const animatedPathProps = useAnimatedProps(() => {
    return {
      strokeDasharray: [pathLength, pathLength],
      strokeDashoffset: pathLength * (1 - progress.value),
    };
  });

  if (!line || line.length === 0) return null;

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width={displayedImageSize.width} height={displayedImageSize.height}>
        <AnimatedPath
          d={pathData}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.8}
          animatedProps={animatedPathProps}
        />
        <Circle cx={startPoint[0]} cy={startPoint[1]} r={6} fill={color} opacity={0.8} />
      </Svg>
    </View>
  );
}
