# Circuits

A circuit is an ordered set of problems in one area. Choosing a circuit on the About tab opens its first problem on the map, and the prev/next buttons on the detail sheet step through it. Tapping a problem marker on the map opens that problem.

## Sub-features

- `circuit-start` a circuit card on About opens the circuit's first problem.
- `circuit-next` the next button moves to the following problem.
- `circuit-previous` the previous button moves back one.
- `circuit-map-tap` tapping a marker on the map reopens that problem's sheet.

## How to get to it (user POV)

- About tab, then one of the `Available Circuits` cards (for example `Forestland Black Circuit`).
- From any open problem in a circuit, the prev/next buttons in its sheet.
- Tapping a problem dot on the map.

## Driving it with Maestro

Preconditions:

- Baseline preconditions from the index.
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` was set at build time, or the map renders blank and markers can't be tapped.

- **All of it, Android.** Run `verify.ts test android 03-map-and-circuit`. JUnit marks `Circuit entry, navigation, and map tap` passed.
- **Start a circuit.** `tapOn: "About"`, then `tapOn: { id: circuit-card-forestland-black }`. Card ids are `circuit-card-<subarea kebab>-<color>`: `forestland-blue`, `swiftwater-red`, `mad-meadows-red`, `forestland-black`, `straightaways-white`. Wait for `The Shallow`.
- **Step forward.** `tapOn: { id: circuit-next-problem }` shows `Cube Crack`, again shows `The Cube`.
- **Step back.** `tapOn: { id: circuit-previous-problem }` shows `Cube Crack`.
- **Map tap, Android.** `pressKey: back` dismisses the sheet; wait for `Cube Crack` to disappear; `tapOn: { point: "50%, 30%" }` lands on the centered marker; wait for `Cube Crack`.
- **iOS.** Copy the flow to `.tmp/verify-cirque/flows/` up to the last `circuit-previous-problem` tap, change the `runFlow` path to `../../../react-native/.maestro/subflows/launch.yml`, end with `assertVisible: "Cube Crack"`, and run it by path. That proves start, next, and previous. Report the map tap as not driven on iOS unless you dismiss the sheet another way and prove it.
- **Proof.** `takeScreenshot:` after each step, so the sequence `The Shallow`, `Cube Crack`, `The Cube`, `Cube Crack` is visible.

## Gotchas

- The map centers the selected problem with bottom padding of 40% of screen height, so its marker sits about 30% down the screen, not at the center.
- Dismiss the sheet with back, not a swipe. A swipe sometimes leaves it at its detent on CI.
- `pressKey: back` doesn't exist on iOS.
