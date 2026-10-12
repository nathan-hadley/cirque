# Tabs

Cirque opens on the Map tab with a search bar over a Mapbox map, and a native tab bar switches between Map, About, and Contribute.

## Sub-features

- `tabs-launch` cold launch lands on the Map tab with `Search problems...` visible.
- `tabs-about` the About tab shows the app intro and the circuit list.
- `tabs-contribute` the Contribute tab shows the submission form.
- `tabs-return` returning to Map keeps the search bar.

## How to get to it (user POV)

- Launch the app.
- Tap `Map`, `About`, or `Contribute` in the tab bar.

## Driving it with Maestro

Preconditions:

- Baseline preconditions from the index.

- **All of it.** Run `verify.ts test <platform> 01-launch-and-tabs`. JUnit marks `Launch and tab navigation` passed.
- **Launch.** The launch subflow waits up to 30s for `Search problems...`. On a fresh install the first launch also seeds data from the bundled snapshot.
- **About.** `tapOn: "About"` then `assertVisible: "Cirque Leavy"` and `"Available Circuits"`.
- **Contribute.** `tapOn: "Contribute"` then `assertVisible: "Share problems not in the app"` and `"Your name"`.
- **Back to Map.** `tapOn: "Map"` then `assertVisible: "Search problems..."`.
- **Proof.** Add `takeScreenshot: about-tab` after the About assertions in a scratch flow, or use the run's `final.png`, which shows the Map tab.

## Gotchas

- On iOS the tab bar is the native liquid-glass bar, on Android the Material bottom bar. Both expose the labels as text, so the same flow works on both.
- On the CI emulator the launcher sometimes ANRs right after boot. The launch subflow closes the `isn't responding` dialog and retries, so a slow first launch isn't a failure on its own.
