# Research: what Expo SDK 57 opens up for Cirque's UI

Resolves [#92](https://github.com/nathan-hadley/cirque/issues/92), a wayfinder research ticket
following on from [#73](https://github.com/nathan-hadley/cirque/issues/73) and
[ADR 0002](../adr/0002-no-component-library.md). Today's date: 2026-09-14. Current app: Expo SDK
54.0.36, RN 0.81.5 (`react-native/package.json`). Latest Expo: SDK 57.0.22.

All findings below were verified against primary sources: `raw.githubusercontent.com/expo/expo`
at the `sdk-54`/`sdk-55`/`sdk-56`/`sdk-57` git tags (package.json, CHANGELOG.md,
bundledNativeModules.json, and actual `@expo/ui` `.tsx`/`.swift`/`.kt` source files), the GitHub
Contents/code-search API, `npm view`, `docs.expo.dev/versions/v57.0.0/`, and
`expo.dev/changelog/sdk-55`/`sdk-57`. Every claim below cites its source. Anything not
independently verified is flagged as such.

## 1. Per-control native options in SDK 57

`@expo/ui` (SwiftUI on iOS, Jetpack Compose on Android) ships two layers: low-level platform
primitives (`swift-ui/*`, `jetpack-compose/*`) and a `community/*` layer of cross-platform
components whose JSDoc explicitly says "drop-in replacement for `<community-lib-name>`". Verified
by reading the actual source files at the `sdk-57` tag
(`packages/expo-ui/src/community/*`, `packages/expo-ui/ios/*`, `packages/expo-ui/android/*`).

| Control | iOS SDK 57 option | Android SDK 57 option | Custom accent color | Replaces |
|---|---|---|---|---|
| Slider | `@expo/ui/swift-ui` `Slider` (SwiftUI `Slider`) via `community/slider` wrapper | `@expo/ui/jetpack-compose` `Slider` via `community/slider` wrapper | Yes, but only the active/minimum track on iOS (generic `tint` modifier); Android has full color control | House slider / any RN slider lib |
| Picker / segmented control | `community/segmented-control` (SwiftUI `Picker(.segmented)`) | `community/segmented-control` (Compose `TabRow`/`SegmentedButton`) | No tint override on iOS at all; Android and web support a tint override | Any RN segmented-control lib |
| Picker (wheel/list style) | `community/picker` (SwiftUI `Picker`) | `community/picker` (Compose) | Not verified for tint; not central to the control's use | `@quidone/react-native-wheel-picker` (app's current dep) |
| Context menu | `community/context-menu` wrapping `MenuView` | `community/context-menu` wrapping `MenuView` | iOS icon tint does not apply to submenu headers or destructive items; otherwise tintable | Any RN context-menu lib |
| Switch | No `community/*` wrapper. Use `swift-ui/Toggle` + `jetpack-compose/Switch` primitives directly | same | Yes on both: iOS via the generic SwiftUI `tint` modifier (exported from `swift-ui/modifiers`); Android via `SwitchView.kt`'s full `SwitchColors` record (8+ checked/unchecked/disabled fields) | House/RN switch |
| Bottom sheet | `community/bottom-sheet` (native `.sheet` presentation) | `community/bottom-sheet`, landed as `BottomSheetView.kt` at **SDK 55** (confirmed 404 at `sdk-54`, 200 at `sdk-55`), renamed `ModalBottomSheetView.kt` by `sdk-56` | Not deeply verified; sheet presentation itself is chrome, not accent-driven | `@lodev09/react-native-true-sheet` (app's current dep) |
| Toast / alert | No `community/*` wrapper. Only raw primitives: `swift-ui` `Alert`/`ConfirmationDialog` | Only raw primitives: `jetpack-compose` `AlertDialog`/`BasicAlertDialog`/`Snackbar` | N/A, no unified wrapper | None available; supports ADR 0002's existing decision to keep toast as a small house Reanimated component |

Two corrections to prior claims, both source-verified:

- **Issue #73's claim that "the Android bottom sheet arrives at SDK 57" is inaccurate.** The
  Android bottom sheet view exists starting at SDK 55
  (`raw.githubusercontent.com/expo/expo/sdk-55/packages/expo-ui/android/.../BottomSheetView.kt`
  returns 200; the same path at `sdk-54` returns 404). It's renamed
  `ModalBottomSheetView.kt` by SDK 56.
- **ADR 0002's claim that "SDK 57 is the first version with cross-platform `@expo/ui` controls"
  is imprecise for Slider, Switch, and Picker.** A full directory listing of
  `packages/expo-ui/android` at the `sdk-54` tag (via the GitHub Contents API) already shows
  `SliderView.kt`, `SwitchView.kt`, and `PickerView.kt` — these three were already cross-platform
  well before SDK 57. What SDK 57 specifically adds on top is the `community/*` drop-in-replacement
  layer (segmented control, context menu, bottom sheet as ready-made cross-platform wrappers) and a
  long list of new SwiftUI modifiers (accessibility, `redacted`/`privacySensitive`,
  `strokeBorder`, `dynamicTypeSize`, etc. — see `CHANGELOG.md` at `sdk-57`, "New features" under
  `@expo/ui`).

## 2. NativeWind 5 preview.4 and Uniwind on SDK 57

Both are compatible with the RN version SDK 57 bundles (0.86.3, see section 4).

- `npm view nativewind@5.0.0-preview.4` depends on `react-native-css@^3.0.1`, whose own
  `peerDependencies` require `react-native>=0.81` (`npm view react-native-css@3.0.1
  peerDependencies`). RN 0.86.3 satisfies this.
- `npm view uniwind@1.12.0 peerDependencies` requires `react-native>=0.81.0` directly. Satisfied.
- NativeWind now has a `5.0.0-rc.0` published, ahead of the `preview.4` referenced in the original
  #73 discussion (`npm view nativewind versions`).
- Uniwind is actively maintained: `npm view uniwind` shows the latest (1.12.0) published about a
  week before this research (2026-09-14), 61 published versions total. Not the stale/abandoned
  fallback it might have looked like when ADR 0002 was written.

Not independently verified: NativeWind 5's open dark/light-mode bug reports referenced in ADR
0002 (whether they're resolved as of `5.0.0-rc.0`). The ADR's own spike, not this research, is the
right way to settle that.

## 3. Other UI-relevant changes, SDK 55 to 57

- **Legacy Architecture removed starting SDK 55.** `expo.dev/changelog/sdk-55` states the
  `newArchEnabled` app.json option was removed; New Architecture is mandatory. **Non-issue for
  Cirque**: `app.config.ts` already sets `newArchEnabled: true`.
- **Liquid glass / `expo-glass-effect` vs `GlassSurface.tsx`.** The app's custom
  `react-native/components/ui/GlassSurface.tsx` uses `GlassView`, `isLiquidGlassAvailable`,
  `glassEffectStyle`, and `isInteractive` from `expo-glass-effect`. That package's own
  `CHANGELOG.md` shows no breaking changes to this API surface across SDK 55 to 57. Low blast
  radius; the component should keep working as-is after the SDK bump.
- **`expo-symbols` on Android.** Expo's own docs state `expo-symbols` renders Material Symbols on
  Android (and web) as a cross-platform fallback to SF Symbols on iOS. Flagged as **not
  independently re-verified via a raw source diff for this research** (I did not diff the
  package's Android implementation across SDK tags); it is a pre-existing app dependency
  (`expo-symbols: ~1.0.8`) already used today, so it isn't new SDK-57 behavior either way.
- **New-arch-only.** Same as above: mandatory since SDK 55, already satisfied.
- **Expo Router.** SDK 57's `CHANGELOG.md` lists only additive changes for `expo-router`:
  `standard-navigation` integration, re-exported drawer content components, `native-tabs`
  `tabPress`/`testID`/`accessibilityLabel` additions, `Stack.Toolbar.Badge` support on Android,
  `unstable_nativeProps`, and an exported `Theme` type. No breaking changes listed for
  `expo-router` specifically in the SDK 57 changelog's "Breaking changes" section.
- **`expo prebuild` breaking change in SDK 57.** `CHANGELOG.md` at `sdk-57`: "Make `expo prebuild`
  clear and regenerate the native folders by default. Pass `--no-clean` to apply changes to the
  existing folders instead." Relevant to EAS builds, which run prebuild (see section 4).
- **`@expo/ui` breaking change in SDK 57 (Android only).** `[universal][android] Use
  BasicTextField component instead of Filled Material TextField` — affects the TextField surface
  of `@expo/ui`, not any control Cirque currently plans to use, but worth knowing if a text-input
  control gets added later.

## 4. Upgrade blast radius (react-native/package.json)

Bundled RN version per SDK, confirmed via `raw.githubusercontent.com/expo/expo/sdk-NN/packages/expo/package.json`:

| SDK | React Native | Source |
|---|---|---|
| 55 | 0.83.10 | `sdk-55/packages/expo/package.json` |
| 56 | 0.85.3 | `sdk-56/packages/expo/package.json` |
| 57 | 0.86.3 | `sdk-57/packages/expo/package.json`, cross-checked against `docs.expo.dev/versions/v57.0.0/` (React Native 0.86, React 19.2.3, react-native-web 0.21.0) |

Build tooling minimums for SDK 57, from `docs.expo.dev/versions/v57.0.0/`: Node.js 22.13.x
minimum, Xcode 26.4+, iOS 16.4+, Android `compileSdkVersion`/`targetSdkVersion` 36, Android OS 7+.

Dependency deltas, current pin (`react-native/package.json`) vs SDK 57's bundled version
(`sdk-57/packages/expo/bundledNativeModules.json`, via `raw.githubusercontent.com`):

| Package | Current | SDK 57 bundles | Note |
|---|---|---|---|
| `expo` | 54.0.36 | 57.0.22 | |
| `react-native` | 0.81.5 | 0.86.3 | |
| `react` / `react-dom` | 19.1.0 | 19.2.3 | |
| `react-native-reanimated` | ~4.1.2 | 4.5.1 | See below, hard peer constraint |
| `react-native-worklets` | 0.5.1 | 0.10.1 | See below, hard peer constraint |
| `react-native-gesture-handler` | ~2.28.0 | ~2.32.0 | |
| `react-native-screens` | ~4.16.0 | ~4.26.0 | |
| `react-native-svg` | ^15.12.1 | 15.15.4 | |
| `react-native-webview` | 13.15.0 | 13.16.1 | |
| `react-native-keyboard-controller` | ^1.18.5 | 1.21.9 | |
| `react-native-safe-area-context` | ^5.6.1 | ~5.7.0 | |
| `expo-router` | ~6.0.24 | ~57.0.21 | Versioning scheme changed to SDK-aligned numbers starting SDK 55 (`~55.0.18` at sdk-55, `~56.2.20` at sdk-56). Cosmetic jump, not a 51-major-version breaking change. |
| `expo-blur` | ~15.0.8 | ~57.0.3 | Same SDK-aligned renumbering |
| `expo-symbols` | ~1.0.8 | ~57.0.3 | Same |
| `expo-glass-effect` | ~0.1.10 | ~57.0.3 | Same |
| `@react-native-async-storage/async-storage` | ^2.2.0 | 2.2.0 | Unchanged |
| `babel-preset-expo` (dev) | ^54.0.12 | needs 57.x line | Not independently checked beyond the naming convention |
| `jest-expo` (dev) | ~54.0.17 | needs 57.x line | Same |

**Reanimated + Worklets** — the tightest constraint found. `npm view
react-native-reanimated@4.5.0 peerDependencies` requires `"react-native": "0.83 - 0.86"` and,
critically, `"react-native-worklets": "0.10.x"` (exact minor pin, not a range). The app's current
pins (reanimated `~4.1.2`, worklets `0.5.1`) predate this window; reanimated 4.1.2's own peers
only required `worklets >= 0.5.0`. **Both must be bumped together** to reanimated ~4.5.x /
worklets ~0.10.x as part of the SDK 57 upgrade, not left on their current pins.

**Mapbox (`@rnmapbox/maps`)** — current pin 10.2.6, latest 10.3.5.
`npm view @rnmapbox/maps@10.3.5 peerDependencies` requires `expo>=47.0.0`, `react-native>=0.79`,
both satisfied by SDK 57. Fabric/New Architecture support landed at v10.1.0 per the package's own
`CHANGELOG.md` (`raw.githubusercontent.com/rnmapbox/maps/main/CHANGELOG.md`); since the app's
current pin (10.2.6) postdates that and `newArchEnabled` is already `true`, this transition looks
already handled. That CHANGELOG.md file explicitly says it's no longer maintained past that point
("We no longer maintain this file. Please check
`https://github.com/rnmapbox/maps/releases`"). Checking GitHub Releases directly
(`gh api repos/rnmapbox/maps/releases`) shows active, recent New-Architecture-specific fixes,
e.g. v10.3.4: "fix(android): MarkerView no longer blocks map pan/pinch (new arch)". Recommend
bumping to 10.3.5 during the SDK upgrade and re-testing MarkerView/gesture interactions on
Android.

**Maestro** — no coupling to the Expo SDK or RN version found. Maestro drives the compiled app
through the platform accessibility tree, not through JS-bundler internals, so it shouldn't be
directly sensitive to the RN 0.81 to 0.86 jump. Searched `mobile-dev-inc/maestro` issues for "new
architecture" (`gh api "search/issues?q=repo:mobile-dev-inc/maestro+new+architecture..."`) and
found no open issues blocking on Expo SDK 57 or RN 0.86 specifically. Cirque's own flows already
needed New-Architecture-era deflaking on Android (commit `5afb645`, "fix(maestro): deflake
Android smoke flows"), so a re-verification pass after the upgrade is expected, but no known hard
blocker was found.

**EAS** — `react-native/eas.json` pins no SDK-specific settings (`"cli": {"version": ">=
16.9.0"}`, `appVersionSource: remote`, standard build profiles). No image is pinned, so EAS's
default build image should track Xcode 26.4+ once available; this should be confirmed against
EAS's own supported-image documentation at upgrade time, which was not fetched in this research
(not independently verified here). The `expo prebuild` default-clean-native-folders change (SDK
57, see section 3) is relevant because EAS managed builds run prebuild; shouldn't be surprising in
CI once known, but is a behavior change from SDK 54.

**Removed by ADR 0002 regardless of SDK compatibility**: `@gluestack-ui/core`,
`@gluestack-ui/utils`, `@gluestack/ui-next-adapter` are being deleted outright per the ADR, so
their SDK 57 compatibility wasn't checked.

## Sources

- `raw.githubusercontent.com/expo/expo/{sdk-54,sdk-55,sdk-56,sdk-57}/packages/expo/package.json`
- `raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json`
- `raw.githubusercontent.com/expo/expo/{sdk-55,sdk-56,sdk-57}/CHANGELOG.md`
- `api.github.com/repos/expo/expo/contents/packages/expo-ui/...?ref=sdk-NN` (directory listings)
- `raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-ui/src/community/*`,
  `packages/expo-ui/ios/*`, `packages/expo-ui/android/*` (actual source read)
- `gh api "search/code?q=...+repo:expo/expo"` (GitHub code search, authenticated via `gh`)
- `docs.expo.dev/versions/v57.0.0/` (version/requirements table)
- `expo.dev/changelog/sdk-55`, `expo.dev/changelog/sdk-57`
- `npm view` for `expo`, `react-native-reanimated`, `react-native-worklets`, `nativewind`,
  `uniwind`, `react-native-css`, `@rnmapbox/maps`
- `raw.githubusercontent.com/rnmapbox/maps/main/CHANGELOG.md`,
  `gh api repos/rnmapbox/maps/releases`
- `gh api "search/issues?q=repo:mobile-dev-inc/maestro+new+architecture..."`
- `react-native/app.config.ts` (grepped for `newArchEnabled`), `react-native/package.json`,
  `react-native/eas.json`, `react-native/components/ui/GlassSurface.tsx` (this repo, current
  worktree, read-only)
