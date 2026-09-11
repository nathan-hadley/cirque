# Grade Range Slider — Design Spec

**Issue:** #68 — "Grade slider filter UX is bad"
**Date:** 2026-07-21

## Problem

The grade filter in `GradeFilterSheet` stacks two separate gluestack single-thumb
`Slider`s on top of each other (one for min, one for max). This produces two UX
defects:

1. **Thumb grabbing is unreliable.** When the two thumbs are close together,
   whichever slider is rendered on top intercepts the touch, so the user cannot
   reliably grab the intended thumb.
2. **Single-grade filtering is impossible.** To work around defect #1, the
   handlers hard-force a gap (`min ≤ max − 1`, `max ≥ min + 1`), so the thumbs can
   never meet. A user cannot filter to exactly one grade (e.g. only V4).

The underlying filter logic already supports a single grade:
`problemGradeNum >= minGrade && problemGradeNum <= maxGrade` returns exactly one
grade when `minGrade === maxGrade`. The restriction lives purely in the sheet's
UI layer.

## Goals

- Reliably grab the intended thumb even when the two thumbs are close or
  overlapping.
- Allow the thumbs to meet so the user can filter to a single grade
  (`min === max`).
- No new dependencies. No changes to the store or the filter logic.
- Keep all existing testIDs and visible strings so the Maestro
  `04-grade-filter.yml` flow keeps passing.

## Non-Goals

- Redesigning the filter into chips or separate stacked sliders (considered and
  rejected — the range-slider look is retained).
- Dragging the filled segment to shift the whole range as a unit (YAGNI).
- Changing grade bounds, store setters, or the circuit/problem filter logic.

## Approach

Replace the two stacked gluestack sliders with a single **custom discrete
dual-thumb range slider**, built on the already-installed
`react-native-gesture-handler` (Pan gesture) and `react-native-reanimated`.

A custom component is required because gluestack's `Slider` is single-thumb only
— stacking two of them is exactly what causes the grabbing bug.

## Components

### `components/RangeSlider.tsx` (new)

A self-contained, reusable discrete dual-thumb range slider. Lives at the
top-level `components/` directory (alongside `MapSearchBar.tsx`) rather than
`components/ui/`, because `components/ui/` is reserved for gluestack primitives
and this is a bespoke component.

**Public API:**

```ts
type RangeSliderProps = {
  min: number; // e.g. 0
  max: number; // e.g. 10
  low: number; // current lower grade (controlled)
  high: number; // current upper grade (controlled)
  step?: number; // default 1
  onChange: (low: number, high: number) => void;
  testID?: string;
};
```

**Rendering:**

- One background track spanning the full width.
- A filled segment between the `low` and `high` thumb positions.
- Two circular thumbs positioned at `low` and `high`.
- Values snap to integer grades (`step`, default 1). The component measures its
  own track width via `onLayout` and maps between x-position and grade value.

**Controlled component:** it holds no committed value state of its own; the
parent owns `low`/`high` and updates them via `onChange`. It may keep transient
gesture state (which thumb is active, live drag position) internally.

### Interaction rules (the core fix)

1. **Nearest-thumb grab.** On touch-down, compute the pixel x of each thumb and
   activate the thumb whose position is closest to the touch x. This removes the
   "top slider steals the touch" problem entirely.
2. **Overlap allowed.** `low` may equal `high`. No forced gap between thumbs.
3. **Tie-break when overlapped.** When both thumbs are on the same grade and the
   user starts dragging, the **first drag direction** decides which thumb moves:
   drag right → move `high` (open the range upward); drag left → move `low`
   (open the range downward). This is what makes escaping a single-grade
   selection feel natural.
4. **No crossing.** The active thumb clamps against the other: `low` is clamped
   to `≤ high`, `high` is clamped to `≥ low`. Thumbs stop when they meet; they do
   not swap roles.
5. **Tap-to-move.** A tap on the track (a zero-distance pan) moves the nearest
   thumb to the tapped grade. Useful given only 11 discrete steps.
6. `onChange(low, high)` fires with snapped integer grades as the drag/tap
   updates values.

### `screens/MapScreen/GradeFilterSheet.tsx` (modified)

- Remove the two stacked `<Slider>`/`<SliderTrack>`/`<SliderThumb>` blocks and
  the wrapping `View`s.
- Render a single `<RangeSlider min={0} max={10} low={localMinGrade}
high={localMaxGrade} onChange={(low, high) => { setLocalMinGrade(low);
setLocalMaxGrade(high); }} />`.
- Delete the `±1` cross-clamp logic in `handleMinGradeChange` /
  `handleMaxGradeChange` (clamping now lives in `RangeSlider`).
- Label: `V{localMinGrade} - V{localMaxGrade}`, collapsing to a single
  `V{n}` when `localMinGrade === localMaxGrade`.
- Keep unchanged: `Sheet` wrapper and `detents`, `SheetHeader` title
  "Adjust grade range", `closeButtonTestID="close-grade-filter"`, the "Reset"
  button and `handleReset`, the `handleClose` → `onClose(localMinGrade,
localMaxGrade)` contract, and the V0 / V10 end labels.

### Unchanged

- `stores/problemStore.ts` — `setMinGrade` / `setMaxGrade` already clamp only to
  the global bounds (not against each other), so `min === max` works as-is.
- The problem/circuit filter logic (`grade >= minGrade && grade <= maxGrade`).
- `screens/MapScreen/index.tsx` `handleGradeFilterSet` and its wiring.

## Data Flow

```
User drags/taps RangeSlider
  → RangeSlider computes snapped (low, high) with nearest-thumb + tie-break + clamp
  → onChange(low, high)
  → GradeFilterSheet setLocalMinGrade / setLocalMaxGrade (local state)
  → user closes sheet
  → handleClose → onClose(localMinGrade, localMaxGrade)
  → MapScreen handleGradeFilterSet → setMinGrade / setMaxGrade (store)
  → existing filter logic applies range (single grade when equal)
```

## Testing

The gesture/render wiring is not unit-tested (RN gesture simulation is brittle).
Instead, the geometry and selection math is extracted into **pure helper
functions** and unit-tested in a colocated `components/RangeSlider.test.ts`:

- `positionToValue(x, trackWidth, min, max, step)` — pixel → snapped grade.
- `valueToPosition(value, trackWidth, min, max)` — grade → pixel.
- `nearestThumb(touchX, lowX, highX)` — returns `"low" | "high"`.
- `resolveActiveThumb(...)` — nearest-thumb pick, including the first-drag
  direction tie-break when `low === high`.
- `clampValue(...)` — the active thumb clamps against the other thumb and the
  global bounds; thumbs stop when they meet and never cross.

Test cases must cover: overlapping thumbs (`low === high`) with drag-right →
`high` moves and drag-left → `low` moves; clamping so `low` cannot exceed `high`
and vice-versa; snapping at track edges (x ≤ 0 → `min`, x ≥ width → `max`); and a
tap between grades snapping to the nearest.

Existing `stores/problemStore.test.ts` and the Maestro `04-grade-filter.yml`
flow remain valid and must continue to pass.

## Acceptance Criteria

- Two close/overlapping thumbs can each be grabbed by touching nearest to them.
- The thumbs can be dragged to the same grade, producing a single-grade filter
  that shows only problems of that grade.
- From a single-grade (overlapped) state, dragging right expands the upper bound
  and dragging left expands the lower bound.
- Thumbs never cross.
- `pnpm lint`, `pnpm typecheck`, `pnpm format`, and `pnpm test` pass.
- The Maestro `04-grade-filter.yml` flow passes unchanged.
