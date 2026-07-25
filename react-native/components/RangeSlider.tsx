import { useRef, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import {
  applyThumbValue,
  positionToValue,
  resolveActiveThumb,
  ThumbKey,
  valueToPosition,
} from "./rangeSliderMath";

const THUMB_SIZE = 24;

type RangeSliderProps = {
  min: number;
  max: number;
  low: number;
  high: number;
  step?: number;
  onChange: (low: number, high: number) => void;
  testID?: string;
};

export default function RangeSlider({
  min,
  max,
  low,
  high,
  step = 1,
  onChange,
  testID,
}: RangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  // Which thumb the active gesture controls; null until direction is known.
  const activeThumb = useRef<ThumbKey | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width);
  }

  function begin() {
    activeThumb.current = null;
  }

  function update(touchX: number, dx: number) {
    const lowX = valueToPosition(low, trackWidth, min, max);
    const highX = valueToPosition(high, trackWidth, min, max);
    if (activeThumb.current === null) {
      activeThumb.current = resolveActiveThumb({
        touchX,
        lowX,
        highX,
        low,
        high,
        dx,
      });
    }
    if (activeThumb.current === null) return; // overlapped, no direction yet
    const rawValue = positionToValue(touchX, trackWidth, min, max, step);
    const next = applyThumbValue({
      active: activeThumb.current,
      rawValue,
      low,
      high,
      min,
      max,
    });
    if (next.low !== low || next.high !== high) {
      onChange(next.low, next.high);
    }
  }

  const pan = Gesture.Pan()
    .onBegin(() => {
      runOnJS(begin)();
    })
    .onUpdate(e => {
      runOnJS(update)(e.x, e.translationX);
    });

  const lowX = valueToPosition(low, trackWidth, min, max);
  const highX = valueToPosition(high, trackWidth, min, max);

  return (
    <GestureDetector gesture={pan}>
      <View
        testID={testID}
        onLayout={handleLayout}
        className="justify-center h-8 w-full"
        collapsable={false}
      >
        {/* Background track */}
        <View className="h-1.5 w-full rounded-lg bg-background-300" />
        {/* Filled segment between the thumbs */}
        <View
          className="absolute h-1.5 rounded-lg bg-primary-500"
          style={{ left: lowX, width: Math.max(0, highX - lowX) }}
        />
        {/* Low thumb */}
        <View
          className="absolute rounded-full bg-primary-500 shadow-hard-1"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            left: lowX - THUMB_SIZE / 2,
          }}
        />
        {/* High thumb */}
        <View
          className="absolute rounded-full bg-primary-500 shadow-hard-1"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            left: highX - THUMB_SIZE / 2,
          }}
        />
      </View>
    </GestureDetector>
  );
}
