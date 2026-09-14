import { useRef, useState } from "react";
import { AccessibilityActionEvent, LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import {
  applyThumbValue,
  positionToValue,
  resolveActiveThumb,
  ThumbKey,
  valueToPosition,
} from "./rangeSliderMath";

const THUMB_SIZE = 24;

const ADJUST_ACTIONS = [
  { name: "increment", label: "increase" },
  { name: "decrement", label: "decrease" },
];

type ThumbProps = {
  x: number;
  label: string;
  value: number;
  valueText: string;
  min: number;
  max: number;
  onAdjust: (delta: number) => void;
  step: number;
};

function Thumb({ x, label, value, valueText, min, max, onAdjust, step }: ThumbProps) {
  function handleAction(e: AccessibilityActionEvent) {
    onAdjust(e.nativeEvent.actionName === "increment" ? step : -step);
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: valueText }}
      accessibilityActions={ADJUST_ACTIONS}
      onAccessibilityAction={handleAction}
      className="absolute rounded-full bg-primary-500 shadow-hard-1"
      style={{ width: THUMB_SIZE, height: THUMB_SIZE, left: x - THUMB_SIZE / 2 }}
    />
  );
}

type RangeSliderProps = {
  min: number;
  max: number;
  low: number;
  high: number;
  step?: number;
  onChange: (low: number, high: number) => void;
  lowLabel?: string;
  highLabel?: string;
  formatValue?: (value: number) => string;
  testID?: string;
};

export default function RangeSlider({
  min,
  max,
  low,
  high,
  step = 1,
  onChange,
  lowLabel = "Minimum",
  highLabel = "Maximum",
  formatValue = String,
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

  function commit(active: ThumbKey, rawValue: number) {
    const next = applyThumbValue({ active, rawValue, low, high, min, max });
    if (next.low !== low || next.high !== high) {
      onChange(next.low, next.high);
    }
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
    commit(activeThumb.current, positionToValue(touchX, trackWidth, min, max, step));
  }

  function adjust(active: ThumbKey, delta: number) {
    commit(active, (active === "low" ? low : high) + delta);
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

  // A pure tap never activates Pan (no movement past its threshold), so it needs
  // its own gesture. Its offset from the thumbs stands in for drag direction, so
  // tapping either side of overlapped thumbs still moves the one facing the tap.
  const tap = Gesture.Tap().onEnd((e, success) => {
    if (!success) return;
    runOnJS(begin)();
    runOnJS(update)(e.x, e.x - lowX);
  });

  const gesture = Gesture.Race(pan, tap);

  // GestureHandlerRootView is required for gestures to fire: this slider renders
  // inside a native TrueSheet, a separate view hierarchy not covered by any root
  // gesture handler. flex-1 lets it fill the space between the V0/V10 labels.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
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
          <Thumb
            x={lowX}
            label={lowLabel}
            value={low}
            valueText={formatValue(low)}
            min={min}
            max={high}
            onAdjust={delta => adjust("low", delta)}
            step={step}
          />
          <Thumb
            x={highX}
            label={highLabel}
            value={high}
            valueText={formatValue(high)}
            min={low}
            max={max}
            onAdjust={delta => adjust("high", delta)}
            step={step}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
