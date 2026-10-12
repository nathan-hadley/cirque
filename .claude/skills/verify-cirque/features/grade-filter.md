# Grade filter

The filter button on the Map tab opens a sheet with a dual-thumb grade range slider. Closing the sheet applies the range to the problems shown on the map, and Reset returns it to the full range.

## Sub-features

- `filter-open` the filter button opens the `Adjust grade range` sheet.
- `filter-range` dragging either thumb changes the range label (for example `V0 - V9`).
- `filter-reset` Reset restores the full range.
- `filter-close` the close button dismisses the sheet and applies the range.

## How to get to it (user POV)

- Tap the filter button next to the search bar on the Map tab.

## Driving it with Maestro

Preconditions:

- Baseline preconditions from the index.

- **Open, reset, close.** Run `verify.ts test <platform> 04-grade-filter`. JUnit marks `Reset and close the grade filter` passed.
- **Open.** `tapOn: { id: open-grade-filter }` then `assertVisible: "Adjust grade range"`.
- **Change the range.** The slider is `grade-range-slider` with thumbs labeled `Minimum grade` and `Maximum grade`. Drag a thumb with `swipe: { from: { id: grade-range-slider }, direction: LEFT }` or a `start`/`end` point swipe, then assert the new range text.
- **Reset.** `tapOn: "Reset"`. The label returns to the full range.
- **Close.** `tapOn: { id: close-grade-filter }` then `assertVisible: "Search problems..."`.
- **Proof.** `takeScreenshot:` with the sheet open after a change, then after close, so the map shows fewer dots.

## Gotchas

- The repo flow only covers open, reset, and close. A change to the slider itself needs a scratch flow that drags a thumb.
- The range applies when the sheet closes, not while dragging.
