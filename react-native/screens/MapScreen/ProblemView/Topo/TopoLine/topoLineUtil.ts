import { Problem } from '@/models/problems';

type GetScaledPointsParams = {
  originalImageSize: { width: number; height: number };
  displayedImageSize: { width: number; height: number };
  problem: Problem;
};

export function getScaledPoints({
  originalImageSize,
  displayedImageSize,
  problem,
}: GetScaledPointsParams) {
  const scaleX = displayedImageSize.width / originalImageSize.width;
  const scaleY = displayedImageSize.height / originalImageSize.height;

  return problem.line.map(([x, y]) => [x * scaleX, y * scaleY]);
}

export function createPath(points: number[][]) {
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
}

// Estimate path length for animation (simple approximation)
export function estimatePathLength(points: number[][]) {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    length += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
  return length;
}
