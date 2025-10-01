import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { Problem } from "@/models/problems";
import { createPath, estimatePathLength, getScaledPoints } from "./topoLineUtil";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type TopoLineProps = {
  problem: Problem;
  originalImageSize: { width: number; height: number };
  displayedImageSize: { width: number; height: number };
};

export function TopoLine({ problem, originalImageSize, displayedImageSize }: TopoLineProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (problem.line && problem.line.length > 0) {
      progress.value = 0;
      progress.value = withDelay(500, withTiming(1, { duration: 500 }));
    }
  }, [problem.id, progress, problem.line]);

  // Calculate values needed for animation (will be empty if no line)
  const scaledPoints =
    problem.line && problem.line.length > 0
      ? getScaledPoints({ originalImageSize, displayedImageSize, problem })
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

  if (!problem.line || problem.line.length === 0) return null;

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width={displayedImageSize.width} height={displayedImageSize.height}>
        <AnimatedPath
          d={pathData}
          stroke={problem.color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.8}
          animatedProps={animatedPathProps}
        />
        <Circle cx={startPoint[0]} cy={startPoint[1]} r={6} fill={problem.color} opacity={0.8} />
      </Svg>
    </View>
  );
}
