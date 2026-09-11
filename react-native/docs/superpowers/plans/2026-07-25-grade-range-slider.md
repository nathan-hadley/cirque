# Grade Range Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two stacked single-thumb sliders in the grade filter with one custom dual-thumb range slider that reliably grabs the nearest thumb, allows the thumbs to meet (single-grade filter), and never lets them cross.

**Architecture:** A pure math module (`rangeSliderMath.ts`) holds all geometry/selection logic and is unit-tested in isolation. A presentational `RangeSlider.tsx` component wires those helpers to a `react-native-gesture-handler` Pan gesture. `GradeFilterSheet.tsx` swaps its two stacked sliders for one `RangeSlider`. The store and filter logic are untouched.

**Tech Stack:** React Native, TypeScript, `react-native-gesture-handler` (~2.28.0), `react-native-reanimated` (~4.1.2), NativeWind, gluestack-ui, Jest (jest-expo).

## Global Constraints

- No new dependencies. Use only `react-native-gesture-handler` and `react-native-reanimated`, already installed.
- Do not modify `stores/problemStore.ts`, its setters, or the problem/circuit filter logic.
- Preserve these visible strings and testIDs so Maestro `04-grade-filter.yml` keeps passing: header title `"Adjust grade range"`, `closeButtonTestID="close-grade-filter"`, the `"Reset"` button text, and `testID="open-grade-filter"` on the filter button (in `components/buttons/FilterButton.tsx`, unchanged).
- Grade bounds are `MIN_GRADE = 0`, `MAX_GRADE = 10` (from `@/models/problems`).
- All work runs from `react-native/` (that's where `package.json`, `jest`, `tsc` live). Commands below assume that cwd.
- Validation gate for every commit: `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format`.
- Colocate tests next to source (`foo.test.ts` beside `foo.ts`), not in `__tests__/`.

---

### Task 1: Pure range-slider math module

All geometry and thumb-selection logic, isolated from React Native so it can be unit-tested with plain Jest (no RN gesture/reanimated mocks needed).

**Files:**

- Create: `react-native/components/rangeSliderMath.ts`
- Test: `react-native/components/rangeSliderMath.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type ThumbKey = "low" | "high"`
  - `clamp(value: number, min: number, max: number): number`
  - `positionToValue(x: number, trackWidth: number, min: number, max: number, step: number): number`
  - `valueToPosition(value: number, trackWidth: number, min: number, max: number): number`
  - `nearestThumb(touchX: number, lowX: number, highX: number): ThumbKey`
  - `resolveActiveThumb(params: { touchX: number; lowX: number; highX: number; low: number; high: number; dx: number }): ThumbKey | null`
  - `applyThumbValue(params: { active: ThumbKey; rawValue: number; low: number; high: number; min: number; max: number }): { low: number; high: number }`

- [ ] **Step 1: Write the failing tests**

Create `react-native/components/rangeSliderMath.test.ts`:

```ts
import {
  applyThumbValue,
  clamp,
  nearestThumb,
  positionToValue,
  resolveActiveThumb,
  valueToPosition,
} from "./rangeSliderMath";

describe("clamp", () => {
  it("clamps below, within, and above", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("positionToValue", () => {
  const w = 200; // 0..10 over 200px => 20px per grade
  it("snaps to the nearest grade", () => {
    expect(positionToValue(0, w, 0, 10, 1)).toBe(0);
    expect(positionToValue(200, w, 0, 10, 1)).toBe(10);
    expect(positionToValue(100, w, 0, 10, 1)).toBe(5);
    expect(positionToValue(109, w, 0, 10, 1)).toBe(5); // 5.45 -> 5
    expect(positionToValue(111, w, 0, 10, 1)).toBe(6); // 5.55 -> 6
  });
  it("clamps out-of-range positions to the bounds", () => {
    expect(positionToValue(-50, w, 0, 10, 1)).toBe(0);
    expect(positionToValue(9999, w, 0, 10, 1)).toBe(10);
  });
});

describe("valueToPosition", () => {
  it("maps grades to pixels and round-trips with positionToValue", () => {
    expect(valueToPosition(0, 200, 0, 10)).toBe(0);
    expect(valueToPosition(10, 200, 0, 10)).toBe(200);
    expect(valueToPosition(5, 200, 0, 10)).toBe(100);
    expect(positionToValue(valueToPosition(7, 200, 0, 10), 200, 0, 10, 1)).toBe(7);
  });
});

describe("nearestThumb", () => {
  it("returns the closer thumb", () => {
    expect(nearestThumb(10, 0, 200)).toBe("low");
    expect(nearestThumb(190, 0, 200)).toBe("high");
  });
  it("returns low on an exact tie", () => {
    expect(nearestThumb(100, 0, 200)).toBe("low");
  });
});

describe("resolveActiveThumb", () => {
  it("picks the nearest thumb when the thumbs are apart", () => {
    expect(resolveActiveThumb({ touchX: 190, lowX: 0, highX: 200, low: 0, high: 10, dx: 0 })).toBe(
      "high"
    );
  });
  it("is undecided at touch-down when the thumbs overlap", () => {
    expect(
      resolveActiveThumb({ touchX: 100, lowX: 100, highX: 100, low: 5, high: 5, dx: 0 })
    ).toBeNull();
  });
  it("moves high when overlapped and dragging right", () => {
    expect(resolveActiveThumb({ touchX: 100, lowX: 100, highX: 100, low: 5, high: 5, dx: 8 })).toBe(
      "high"
    );
  });
  it("moves low when overlapped and dragging left", () => {
    expect(
      resolveActiveThumb({ touchX: 100, lowX: 100, highX: 100, low: 5, high: 5, dx: -8 })
    ).toBe("low");
  });
});

describe("applyThumbValue", () => {
  it("moves low but clamps it to not exceed high", () => {
    expect(
      applyThumbValue({ active: "low", rawValue: 3, low: 1, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 3, high: 6 });
    expect(
      applyThumbValue({ active: "low", rawValue: 9, low: 1, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 6, high: 6 });
  });
  it("moves high but clamps it to not go below low", () => {
    expect(
      applyThumbValue({ active: "high", rawValue: 8, low: 2, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 2, high: 8 });
    expect(
      applyThumbValue({ active: "high", rawValue: 1, low: 2, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 2, high: 2 });
  });
  it("clamps to the global bounds", () => {
    expect(
      applyThumbValue({ active: "low", rawValue: -5, low: 3, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 0, high: 6 });
    expect(
      applyThumbValue({ active: "high", rawValue: 99, low: 3, high: 6, min: 0, max: 10 })
    ).toEqual({ low: 3, high: 10 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- rangeSliderMath`
Expected: FAIL — `Cannot find module './rangeSliderMath'`.

- [ ] **Step 3: Write the implementation**

Create `react-native/components/rangeSliderMath.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- rangeSliderMath`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add react-native/components/rangeSliderMath.ts react-native/components/rangeSliderMath.test.ts
git commit -m "feat: range slider geometry + thumb-selection helpers (#68)"
```

Expected: `pnpm typecheck` prints no errors.

---

### Task 2: `RangeSlider` presentational component

Wires the Task 1 helpers to a Pan gesture and renders a track, filled segment, and two thumbs.

**Files:**

- Create: `react-native/components/RangeSlider.tsx`

**Interfaces:**

- Consumes (from Task 1): `positionToValue`, `valueToPosition`, `resolveActiveThumb`, `applyThumbValue`, `ThumbKey`.
- Produces:
  - Default export `RangeSlider` with props
    `{ min: number; max: number; low: number; high: number; step?: number; onChange: (low: number, high: number) => void; testID?: string }`.

- [ ] **Step 1: Write the implementation**

Create `react-native/components/RangeSlider.tsx`:

```tsx
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
```

Notes for the implementer:

- `e.x` is the touch position relative to the `GestureDetector`'s view (the track container), which is exactly the coordinate space `positionToValue` expects. `e.translationX` is the signed drag delta used for the overlap tie-break.
- `activeThumb` is a `useRef` (not state) so updating it mid-gesture never triggers a re-render or resets the decision.
- The thumbs render at their true value positions on every `onChange`-driven re-render; there is no separate animated position to keep in sync.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors. If TypeScript complains about `runOnJS` or `Gesture` types, confirm imports match the installed versions (`react-native-reanimated` ~4.1.2, `react-native-gesture-handler` ~2.28.0).

- [ ] **Step 3: Lint and format**

Run: `pnpm lint && pnpm format`
Expected: lint passes; format rewrites the new file if needed.

- [ ] **Step 4: Commit**

```bash
git add react-native/components/RangeSlider.tsx
git commit -m "feat: dual-thumb RangeSlider component (#68)"
```

---

### Task 3: Integrate `RangeSlider` into `GradeFilterSheet`

Swap the two stacked sliders for one `RangeSlider`, drop the forced-gap logic, and collapse the label to a single grade when the thumbs meet.

**Files:**

- Modify: `react-native/screens/MapScreen/GradeFilterSheet.tsx`

**Interfaces:**

- Consumes (from Task 2): default export `RangeSlider`.
- Produces: unchanged `onClose(minGrade: number, maxGrade: number)` contract to `MapScreen`.

- [ ] **Step 1: Replace the component body**

Rewrite `react-native/screens/MapScreen/GradeFilterSheet.tsx` to:

```tsx
import { useState } from "react";
import RangeSlider from "@/components/RangeSlider";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MAX_GRADE, MIN_GRADE } from "@/models/problems";
import { useProblemStore } from "@/stores/problemStore";

const numberToGrade = (num: number): string => `V${num}`;

function formatRange(min: number, max: number): string {
  return min === max ? numberToGrade(min) : `${numberToGrade(min)} - ${numberToGrade(max)}`;
}

type GradeFilterSheetProps = {
  isOpen: boolean;
  onClose: (minGrade: number, maxGrade: number) => void;
};

export default function GradeFilterSheet({ isOpen, onClose }: GradeFilterSheetProps) {
  const { minGrade, maxGrade } = useProblemStore();
  const [localMinGrade, setLocalMinGrade] = useState(minGrade);
  const [localMaxGrade, setLocalMaxGrade] = useState(maxGrade);

  function handleRangeChange(low: number, high: number) {
    setLocalMinGrade(low);
    setLocalMaxGrade(high);
  }

  function handleReset() {
    setLocalMinGrade(MIN_GRADE);
    setLocalMaxGrade(MAX_GRADE);
  }

  function handleClose() {
    onClose(localMinGrade, localMaxGrade);
  }

  return (
    <Sheet isOpen={isOpen} onClose={handleClose} detents={["auto"]}>
      <VStack className="w-full pb-4">
        <SheetHeader
          title="Adjust grade range"
          onClose={handleClose}
          closeButtonTestID="close-grade-filter"
        />

        <VStack space="lg" className="px-6 pb-6">
          <HStack className="justify-between items-center">
            <Text size="lg" className="font-semibold">
              {formatRange(localMinGrade, localMaxGrade)}
            </Text>
            <Button onPress={handleReset} variant="outline" size="sm">
              <ButtonText>Reset</ButtonText>
            </Button>
          </HStack>

          <HStack space="2xl" className="items-center">
            <Text size="lg">V{MIN_GRADE}</Text>
            <RangeSlider
              min={MIN_GRADE}
              max={MAX_GRADE}
              low={localMinGrade}
              high={localMaxGrade}
              onChange={handleRangeChange}
              testID="grade-range-slider"
            />
            <Text size="lg">V{MAX_GRADE}</Text>
          </HStack>
        </VStack>
      </VStack>
    </Sheet>
  );
}
```

Key changes from the original:

- Removed `View` and gluestack `Slider`/`SliderTrack`/`SliderThumb` imports and the two absolutely-positioned stacked sliders.
- Removed `handleMinGradeChange` / `handleMaxGradeChange` and their `±1` forced-gap clamps.
- Added `formatRange` so a single grade shows as `V4` rather than `V4 - V4`.
- End labels use `V{MIN_GRADE}` / `V{MAX_GRADE}` instead of hardcoded `V0` / `V10`.
- `RangeSlider` sits inside the same `HStack` as the end labels; it fills the space between them (`className="... w-full"` inside the component plus the flex row).

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Run the full unit suite**

Run: `pnpm test`
Expected: PASS, including the untouched `stores/problemStore.test.ts` and `screens/MapScreen/index.test.ts`, plus `rangeSliderMath.test.ts`.

- [ ] **Step 4: Lint and format**

Run: `pnpm lint && pnpm format`
Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add react-native/screens/MapScreen/GradeFilterSheet.tsx
git commit -m "feat: use dual-thumb RangeSlider in grade filter, allow single grade (#68)"
```

---

### Task 4: Manual verification

No code changes — confirm the fix behaves and nothing regressed. This task's deliverable is a verification note, not a commit.

- [ ] **Step 1: Full validation gate**

Run: `pnpm typecheck && pnpm test && pnpm lint`
Expected: all pass.

- [ ] **Step 2: Launch the app and exercise the filter**

Use the `run` skill (or `pnpm start`) to open the app on a simulator. Open the grade filter (the filter button, `open-grade-filter`) and verify:

- Dragging near either thumb grabs _that_ thumb, even when the thumbs are close together.
- The thumbs can be dragged to the same grade; the label collapses to a single `V{n}` (e.g. `V4`).
- From that overlapped state, dragging right raises the upper bound and dragging left lowers the lower bound.
- The thumbs never cross.
- Tapping a spot on the track moves the nearest thumb to that grade.
- Closing the sheet applies the range; a single-grade selection shows only problems of that grade on the map.

- [ ] **Step 3: Confirm the Maestro flow still matches**

The strings/testIDs the `04-grade-filter.yml` flow depends on (`open-grade-filter`, `"Adjust grade range"`, `"Reset"`, `close-grade-filter`) are all still present. If a release build is available, run the Maestro suite; otherwise note that the flow's selectors are unchanged.

---

## Self-Review

**Spec coverage:**

- Nearest-thumb grab → Task 1 `nearestThumb`/`resolveActiveThumb` + Task 2 `update`. ✓
- Overlap allowed / single grade → Task 1 `applyThumbValue` (no forced gap) + Task 3 removal of `±1` clamps + `formatRange`. ✓
- Tie-break by first drag direction → Task 1 `resolveActiveThumb` + Task 2 `activeThumb` ref. ✓
- No crossing → Task 1 `applyThumbValue` clamps. ✓
- Tap-to-move → Task 2 Pan `onUpdate` uses `e.x` (a tap is a zero-distance pan; nearest thumb resolves because non-overlapped, or direction resolves once movement occurs). ✓
- New `components/RangeSlider.tsx`, math split out → Tasks 1–2. (Spec named `RangeSlider.test.ts`; refined to `rangeSliderMath.test.ts` so pure logic tests need no RN gesture mocks — same coverage, better isolation.) ✓
- `GradeFilterSheet` changes, preserved strings/testIDs → Task 3 + Global Constraints. ✓
- Store/filter untouched → not modified by any task. ✓
- Tests for the listed math cases → Task 1 Step 1. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to". All steps carry real code and exact commands. ✓

**Type consistency:** `ThumbKey`, `positionToValue`, `valueToPosition`, `resolveActiveThumb`, `applyThumbValue` signatures match between Task 1 (definition), Task 1 tests, and Task 2 (consumption). `RangeSlider` prop shape matches between Task 2 (definition) and Task 3 (usage). ✓
