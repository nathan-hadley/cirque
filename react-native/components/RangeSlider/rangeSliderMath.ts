export type ThumbKey = "low" | "high";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Pixel x within the track -> nearest snapped grade value, clamped to [min, max]. */
export function positionToValue(
  x: number,
  trackWidth: number,
  min: number,
  max: number,
  step: number
): number {
  if (trackWidth <= 0) return min;
  const ratio = clamp(x / trackWidth, 0, 1);
  const raw = min + ratio * (max - min);
  const snapped = Math.round(raw / step) * step;
  return clamp(snapped, min, max);
}

/** Grade value -> pixel x of the thumb center within the track. */
export function valueToPosition(
  value: number,
  trackWidth: number,
  min: number,
  max: number
): number {
  if (max === min) return 0;
  const ratio = (value - min) / (max - min);
  return clamp(ratio, 0, 1) * trackWidth;
}

/** The thumb whose pixel position is closer to touchX. Ties resolve to "low". */
export function nearestThumb(touchX: number, lowX: number, highX: number): ThumbKey {
  const distLow = Math.abs(touchX - lowX);
  const distHigh = Math.abs(touchX - highX);
  return distHigh < distLow ? "high" : "low";
}

/**
 * Decide which thumb the gesture controls.
 * - When the thumbs are apart: the nearest thumb to the touch.
 * - When they overlap (low === high): the first drag direction decides — right
 *   moves "high", left moves "low". Returns null while still undecided (dx === 0).
 */
export function resolveActiveThumb(params: {
  touchX: number;
  lowX: number;
  highX: number;
  low: number;
  high: number;
  dx: number;
}): ThumbKey | null {
  const { touchX, lowX, highX, low, high, dx } = params;
  if (low !== high) return nearestThumb(touchX, lowX, highX);
  if (dx > 0) return "high";
  if (dx < 0) return "low";
  return null;
}

/** Apply a raw grade to the active thumb, clamped against the other thumb and bounds. */
export function applyThumbValue(params: {
  active: ThumbKey;
  rawValue: number;
  low: number;
  high: number;
  min: number;
  max: number;
}): { low: number; high: number } {
  const { active, rawValue, low, high, min, max } = params;
  if (active === "low") {
    return { low: clamp(rawValue, min, high), high };
  }
  return { low, high: clamp(rawValue, low, max) };
}
