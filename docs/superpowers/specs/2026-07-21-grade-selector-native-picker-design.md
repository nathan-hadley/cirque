# Grade selector → native picker (issue #67)

## Problem

The grade selector on the Contribute tab (`screens/Contribute/GradePicker.tsx`)
sometimes doesn't render until the user scrolls. It uses `react-native-wheely`,
a JS `ScrollView`-based wheel, inside a `TrueSheet` with `detents={["auto"]}`.
The sheet measures its content height before the wheel finishes laying out, so
the wheel collapses/mis-positions until a scroll forces a re-layout — the
"doesn't appear until you scroll" symptom.

Wheely is used **only** in this component, so replacing it has no blast radius.

## Approach

Swap `react-native-wheely` for `@react-native-picker/picker` (official
community picker, native `UIPickerView` on iOS / native picker on Android). A
native picker measures correctly inside the sheet, fixing the bug at the root,
and feels more platform-native.

- iOS: renders as a native spinning wheel (same UX as today).
- Android: renders as a native dropdown/dialog — functionally equivalent, still
  native. Accepted trade-off.

## Changes

1. **Dependencies:** remove `react-native-wheely`; add
   `@react-native-picker/picker` via `npx expo install` (Expo SDK 54) so the
   version is SDK-compatible. Requires a native rebuild (already needed for
   TrueSheet).

2. **`GradePicker.tsx` internals only.** Public contract
   (`isOpen` / `onClose(grade)` / `currentGrade`) is unchanged, so
   `Contribute/index.tsx` is untouched. Keep the `Sheet` + `SheetHeader`
   wrapper, the V3 default, and the `currentGrade` sync. Replace `<WheelPicker>`
   with `<Picker>` + `<Picker.Item>` mapped over `GRADES`, driven by the grade
   value (not an index), still writing through `gradeRef` so close returns the
   selected grade.

3. **Height:** wrap the picker in a fixed-height container (iOS `Picker` has no
   usable intrinsic height) and keep `detents={["auto"]}` so the sheet sizes to
   header + picker. This is what removes the appears-only-after-scroll bug.

4. **Dark mode:** preserve current behavior via `itemStyle` text color on iOS
   and the `color` prop on Android.

## Testing

- `open-grade-picker` / `close-grade-picker` testIDs preserved.
- Maestro `05-contribute.yml` only opens the picker, asserts "Select grade",
  and closes on the V3 default — no per-item testIDs required.
- Verify with `pnpm lint`, `pnpm typecheck`, `pnpm format`.
