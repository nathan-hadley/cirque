import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Problem } from '@/models/problems';

type TopoLineProps ={
  problem: Problem;
  originalImageSize: { width: number; height: number };
  displayedImageSize: { width: number; height: number };
};

export function TopoLine({
  problem,
  originalImageSize,
  displayedImageSize,
}: TopoLineProps) {
  if (!problem.line || problem.line.length === 0) {
    return null;
  }

  const scaleX = displayedImageSize.width / originalImageSize.width;
  const scaleY = displayedImageSize.height / originalImageSize.height;

  const scaledPoints = problem.line.map(([x, y]) => [
    x * scaleX,
    y * scaleY,
  ]);

  function createPath(points: number[][]) {
    if (points.length === 0) return '';

    let path = `M ${points[0][0]} ${points[0][1]}`;

    // Create smooth curves between points using quadratic Bezier curves
    for (let i = 1; i < points.length; i++) {
      const currentPoint = points[i];
      const prevPoint = points[i - 1];
      
      // Calculate midpoint for smooth curves
      const midX = (prevPoint[0] + currentPoint[0]) / 2;
      const midY = (prevPoint[1] + currentPoint[1]) / 2;
      
      // Use quadratic curve with previous point as control point
      path += ` Q ${prevPoint[0]} ${prevPoint[1]} ${midX} ${midY}`;
    }
    
    // Add final line to last point
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      path += ` L ${lastPoint[0]} ${lastPoint[1]}`;
    }

    return path;
  };

  const pathData = createPath(scaledPoints);
  const startPoint = scaledPoints[0];
  const capRadius = 5;

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width={displayedImageSize.width} height={displayedImageSize.height}>
        <Path
          d={pathData}
          stroke={problem.color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle
          cx={startPoint[0]}
          cy={startPoint[1]}
          r={capRadius}
          fill={problem.color}
        />
      </Svg>
    </View>
  );
} 