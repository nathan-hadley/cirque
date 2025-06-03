import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Problem } from '@/models/problems';
import { createPath, estimatePathLength, getScaledPoints } from './topoLineUtil';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface TopoLineProps {
  problem: Problem;
  originalImageSize: { width: number; height: number };
  displayedImageSize: { width: number; height: number };
}

export function TopoLine({ problem, originalImageSize, displayedImageSize }: TopoLineProps) {
  if (!problem.line || problem.line.length === 0) return null;

  const progress = useSharedValue(0);

  useEffect(() => {
    // Trigger animation when problem changes
    progress.value = 0;
    progress.value = withDelay(200, withTiming(1, { duration: 500 }));
  }, [problem.id]);

  const scaledPoints = getScaledPoints({
    originalImageSize,
    displayedImageSize,
    problem,
  });

  const pathData = createPath(scaledPoints);
  const pathLength = estimatePathLength(scaledPoints);
  const startPoint = scaledPoints[0];

  const animatedPathProps = useAnimatedProps(() => {
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength * (1 - progress.value),
    };
  });

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
