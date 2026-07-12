# iOS Liquid Glass + Native Sheets (and Android nativeness)

**Date:** 2026-07-12
**Branch:** `nathan-hadley/ios-glass`
**Status:** Approved

## Goal

Make Cirque feel native on both platforms:

1. Adopt iOS 26 Liquid Glass for app chrome (tab bar, floating map controls).
2. Replace every JS-modal sheet with a real native sheet.
3. Take the Android nativeness wins that fall out of the same changes.

Glass is applied to **chrome only**. Content surfaces (Contribute form, About screen,
search results) keep their current gluestack/NativeWind styling. Glassing scrolling
content is the failure mode Apple's HIG explicitly warns against.

## Current state

- Expo SDK 54, RN 0.81.5, expo-router 6, `newArchEnabled: true`, CNG (no `ios/`/`android/` dirs).
- Sheets are gluestack `Actionsheet` (JS `Modal` + Reanimated) in exactly five files:
  `screens/MapScreen/ProblemSheet/index.tsx`, `screens/MapScreen/GradeFilterSheet.tsx`,
  `screens/Contribute/AreaPicker.tsx`, `screens/Contribute/GradePicker.tsx`,
  `screens/Contribute/ProblemPicker.tsx`.
  - `TopoPicker` is **not** a sheet (inline form UI) — out of scope.
  - `ImageDrawingModal` is a **full-screen RN `Modal`**, not a bottom sheet — out of scope.
- Tab bar is expo-router JS `Tabs` with a hand-rolled `BlurBackground`
  (expo-blur on iOS, flat `View` + border on Android) and `HapticTab`.
- `BlurBackground` has **two** call sites beyond the tab bar: `position="statusBar"` in
  `screens/Contribute/index.tsx:171` and `screens/AboutScreen/index.tsx:134`. It therefore
  cannot be deleted along with the tab bar — `GlassSurface` must absorb the status-bar
  variant first.
- Floating map chrome: `MapSearchBar`, `FilterButton`, `LocateMeButton`.

Known symptoms of the JS-modal approach:

- `ProblemSheet` skips its `ScrollView` on Android with the comment
  *"The ScrollView doesn't work well on Android"* — a workaround for a JS sheet.
- `MapScreen` hardcodes `bottomOffset = 0` on Android, assuming an opaque tab bar.
- `HapticTab` no-ops on Android (`process.env.EXPO_OS === "ios"` guard).

## Architecture

Three new seams, each replacing something hand-rolled.

### A. `NativeTabs` replaces `Tabs` + `BlurBackground` + `HapticTab`

`app/(tabs)/_layout.tsx` moves to `expo-router/unstable-native-tabs`. This renders a real
`UITabBarController` on iOS, which yields Liquid Glass, scroll-edge morphing, and the
tab-bar minimize behavior for free — none of which the JS tab bar can do. On Android it
renders a Material 3 `BottomNavigationView` (ripple, state layers, correct elevation).

- Icons become **SF Symbols** on iOS (`map`, `info.circle`, `plus.circle`), Lucide on Android.
- `components/HapticTab.tsx` is **deleted** — native tabs do platform-correct press feedback.
- `components/BlurBackground.tsx` is deleted **only after** its two `position="statusBar"`
  call sites (Contribute, About) move to `GlassSurface`.

**Risk:** `NativeTabs` is `unstable_` in expo-router 6 and its API has churned.
**Fallback if it fights us:** keep JS `Tabs` and put `GlassSurface` in `tabBarBackground`.

### B. `Sheet` (TrueSheet wrapper) replaces gluestack `Actionsheet`

Add `@lodev09/react-native-true-sheet@^3.11.4`. It is a Fabric/new-arch native component
with documented iOS 26 Liquid Glass support, needs no config plugin (autolinking under CNG),
and all its optional peers are already present (`react-native-reanimated@4`,
`react-native-worklets`, `@react-navigation/core@7`).

New component `components/ui/sheet/index.tsx` wraps `TrueSheet` with app conventions:
grabber, corner radius, glass/blur background on iOS, Material surface on Android,
safe-area-aware footer. Every sheet migrates to it. gluestack `actionsheet` is removed.

**Verified v3 API** (read from the published package, not assumed):

- Detents are `detents={['auto' | 'peek' | number]}` (max 3), **not** `sizes`.
- `dimmed`, `dimmedDetentIndex`, `grabber`, `cornerRadius`, `scrollable`, `header`, `footer`,
  `backgroundColor`, `backgroundBlur`.
- Imperative control via ref: `present(index?)`, `dismiss()`, `resize(index)`.

**Liquid Glass is opt-out, not opt-in.** Per the TrueSheet docs: *"By default, TrueSheet
enables Liquid Glass on iOS 26+ when no `backgroundColor` or `backgroundBlur` is provided."*
Setting either prop **silently disables glass**. The `Sheet` wrapper must therefore leave
both unset on iOS 26 — this is the single easiest thing to get wrong in this whole project.

`ProblemSheet` is the sheet that motivates this choice. It gets:

- `detents={[0.5, 1]}` — native detents with real rubber-banding.
- `dimmed={false}` — **the map stays fully interactive behind it**.
- No `backgroundColor` / `backgroundBlur` on iOS → Liquid Glass.
- Its Android `ScrollView` workaround is deleted; `scrollable` handles it natively.

**Alternative considered and rejected:** `react-native-screens` `presentation: "formSheet"`.
Same native iOS API underneath and no new dependency, but it forces every sheet to become
a route (large refactor of Contribute + Map state) and is fiddlier for the one sheet that
matters most — the non-dimmed, map-interactive `ProblemSheet`.

### C. `GlassSurface` fronts `expo-glass-effect`

Add `expo-glass-effect@~0.1.10` (the version SDK 54 bundles).

`components/ui/GlassSurface.tsx` renders:

- `GlassView` when `isLiquidGlassAvailable()` (iOS 26+),
- `expo-blur` `BlurView` on iOS < 26,
- a Material elevated surface on Android.

The floating map controls move onto it. `FilterButton` and `LocateMeButton` share a
`GlassContainer` so they merge/morph as a group on iOS 26, the way native map controls do.

## Android nativeness

Mostly falls out of A and B, plus targeted fixes:

- **Bottom nav** → real Material 3 `BottomNavigationView` (from `NativeTabs`).
- **Sheets** → native `BottomSheetDialog`: drag-to-dismiss, velocity-aware settling, correct scrim.
- **Haptics** → enable on Android for the remaining explicit call sites (`CircuitNavButtons`).
- **Edge-to-edge** → `MapScreen` must honor the real inset instead of `bottomOffset = 0`.
- **Predictive back** → enable `android.predictiveBackGestureEnabled` in `app.config.ts`.
- **Ripple** → floating map buttons get `android_ripple` instead of an opacity fade.

## Compatibility matrix

| Surface      | iOS 26+                        | iOS 18–25            | Android                    |
| ------------ | ------------------------------ | -------------------- | -------------------------- |
| Tab bar      | Liquid Glass (native)          | Native blur tab bar  | Material 3 bottom nav      |
| Sheets       | Glass sheet, native detents    | Native detents, blur | `BottomSheetDialog`        |
| Map controls | `GlassView` + `GlassContainer` | `BlurView`           | Elevated Material surface  |

Everything routes through `isLiquidGlassAvailable()` or `Platform.select` at **runtime**.
Nothing is gated at build time; the app stays shippable on every supported OS version.

## Hard constraints

1. **Every existing `testID` must survive the refactor.** The `.maestro` Android smoke
   suite (`01`–`05`) asserts on all of these — breaking one silently breaks CI:

   `area-option-forestland`, `circuit-card-forestland-black`, `circuit-next-problem`,
   `circuit-previous-problem`, `close-area-picker`, `close-grade-filter`,
   `close-grade-picker`, `contact-email-input`, `contact-name-input`, `latitude-input`,
   `longitude-input`, `open-area-picker`, `open-grade-filter`, `open-grade-picker`,
   `open-problem-search`, `problem-description-input`, `problem-name-input`,
   `problem-search-input`, `problem-search-result-<uuid>`, `submit-problem`.

   Note that these live on elements that are being replaced — the sheet close buttons and
   the sheet trigger buttons. TrueSheet's header/footer must carry them forward.

2. Visible copy asserted by Maestro must not change: `"Adjust grade range"`,
   `"Search problems..."`, `"Select area"`, `"Select grade"`, `"Reset"`, `"V0"`,
   `"Available Circuits"`, `"Please fill out all required fields."`, `"Your name"`,
   and problem/area names.

3. **The tab titles `"Map"`, `"About"`, and `"Contribute"` are asserted by Maestro**, so
   `NativeTabs` must keep those exact labels visible.
4. Native modules mean **prebuild is required**; verification must run a real
   `expo run:ios` build, not Expo Go.

## Error handling

- `isLiquidGlassAvailable()` is the single runtime switch for glass. No version sniffing
  scattered through components.
- TrueSheet presentation failures are logged, not swallowed — a broken sheet should be
  loud, not a dead tap.

## Testing

- **Primary:** build to the **iOS 26.0 simulator** and drive each surface, screenshotting
  and visually confirming: tab bar renders glass and morphs on scroll; tapping a map
  problem opens `ProblemSheet` at the half detent **with the map still panning behind it**;
  drag-to-large and drag-to-dismiss work; grade filter and all Contribute pickers open,
  select, and close; glass map controls read correctly in light **and** dark mode.
- **Android regression:** the existing `.maestro` smoke suite must pass.
- **Gate:** `pnpm check-all` (format + lint + typecheck) and `pnpm test`.
- **Not doing:** snapshot tests against native components. They render as opaque host
  views, so the assertions would be vacuous. The existing Jest suite covers stores and
  services, which this work does not touch.

## Execution

Implementation and simulator verification are performed by Codex (`gpt-5.6-terra`,
`model_reasoning_effort=max`), which has been given the `ios-simulator` and `xcodebuild`
MCP servers and can view screenshots it captures. Codex must be run with
`--dangerously-bypass-approvals-and-sandbox`; otherwise its approval hook silently cancels
MCP tool calls in non-interactive mode.

Phased commits, each independently revertible:

1. Dependencies (`expo-glass-effect`, `@lodev09/react-native-true-sheet`) + prebuild config.
2. `GlassSurface`.
3. `NativeTabs` (delete `BlurBackground`, `HapticTab`).
4. `Sheet` wrapper on TrueSheet.
5. Per-sheet migration (`ProblemSheet` first — it is the riskiest).
6. Glass map controls.
7. Android polish (edge-to-edge, predictive back, ripple, haptics).
8. Cleanup: remove gluestack `actionsheet`, dead deps.

Ships as one PR with before/after screenshots.
