# iOS Liquid Glass + Native Sheets Implementation Plan

> **For agentic workers:** Implement this plan task-by-task, in order. Steps use checkbox
> (`- [ ]`) syntax for tracking. Do not skip the simulator verification steps — this is a
> UI project and a green typecheck proves nothing about whether the glass rendered.

**Goal:** Convert Cirque's chrome to iOS 26 Liquid Glass, replace every JS-modal sheet with
a native sheet, and take the Android nativeness wins that fall out of the same changes.

**Architecture:** Three new seams — `NativeTabs` (real `UITabBarController` / Material 3
`BottomNavigationView`), a `Sheet` wrapper over `@lodev09/react-native-true-sheet`, and a
`GlassSurface` component fronting `expo-glass-effect` with runtime fallbacks. Glass is
applied to **chrome only**; content surfaces keep their gluestack/NativeWind styling.

**Tech Stack:** Expo SDK 54, RN 0.81.5 (new arch), expo-router 6, TypeScript, NativeWind,
gluestack-ui, `expo-glass-effect@~0.1.10`, `@lodev09/react-native-true-sheet@^3.11.4`.

**Spec:** `docs/superpowers/specs/2026-07-12-ios-glass-native-sheets-design.md`

## Global Constraints

These apply to **every** task. Violating one fails the task.

1. **Working directory is `react-native/`.** All paths below are relative to it.
2. **`node_modules` is not installed in this worktree.** Run `pnpm install` first (Task 0).
3. **Liquid Glass on TrueSheet is opt-out, not opt-in.** It is enabled by default on iOS 26+
   **only when neither `backgroundColor` nor `backgroundBlur` is set**. Setting either one
   silently disables glass. Never set them on iOS 26.
4. **Every existing `testID` must survive.** The `.maestro` Android suite asserts on all of:
   `area-option-forestland`, `circuit-card-forestland-black`, `circuit-next-problem`,
   `circuit-previous-problem`, `close-area-picker`, `close-grade-filter`,
   `close-grade-picker`, `contact-email-input`, `contact-name-input`, `latitude-input`,
   `longitude-input`, `open-area-picker`, `open-grade-filter`, `open-grade-picker`,
   `open-problem-search`, `problem-description-input`, `problem-name-input`,
   `problem-search-input`, `problem-search-result-<uuid>`, `submit-problem`.
   Several of these live on the very elements being replaced (sheet close buttons, sheet
   triggers). Carry them forward onto the TrueSheet header/footer equivalents.
5. **Visible copy asserted by Maestro must not change:** `"Adjust grade range"`,
   `"Search problems..."`, `"Select area"`, `"Select grade"`, `"Reset"`, `"V0"`,
   `"Available Circuits"`, `"Please fill out all required fields."`, `"Your name"`.
6. **Tab labels `"Map"`, `"About"`, `"Contribute"` must remain visible** — Maestro taps them.
7. **Gate before every commit:** `pnpm check-all` (format:check + lint + typecheck) and
   `pnpm test` must pass.
8. **Native modules mean prebuild is mandatory.** Verify on a real `expo run:ios` build
   against the **iOS 26.0** simulator. Expo Go cannot load these.
9. **Do not glassify content.** Contribute form, About screen, and search results keep their
   current styling. Glass is for chrome only.
10. **Do not write snapshot tests against native components.** They render as opaque host
    views; the assertions would be vacuous. Verification is visual, in the simulator.
11. **Keep the code minimal. This project should DELETE more lines than it adds.**
    The entire point of going native is that the platform does the work — every hand-rolled
    workaround you keep is a bug you chose to own. Specifically:
    - **No new abstractions beyond the three named seams** (`GlassSurface`, `Sheet`/
      `SheetHeader`, `NativeTabs` layout). No theme providers, no config objects, no
      `useGlass()` hooks, no wrapper-around-the-wrapper.
    - **No props "for future flexibility."** If a prop has exactly one call site passing
      exactly one value, inline it. YAGNI.
    - **Prefer deleting a workaround to porting it.** The Android `ScrollView` fork, the
      `h-[60vh]` hack, the `snapPoints` guessing, the manual `bottomOffset` math — these
      exist because JS sheets are bad. The native sheet makes them unnecessary. Delete them;
      do not translate them.
    - **Do not restyle anything the task doesn't name.** No drive-by refactors, no
      renaming, no "while I'm here" cleanups. If you think something else is broken, say so
      in your final report instead of fixing it.
    - **Do not add comments explaining what the code does or why your change is correct.**
      The one comment class that earns its place is a constraint the code can't express —
      e.g. "setting backgroundColor here silently disables Liquid Glass."

## Verification Protocol (used by every task)

Because this is a UI project, "done" means **seen working**, not "compiles". For each task:

1. `pnpm check-all && pnpm test`
2. Build/reload onto the booted **iOS 26.0** simulator.
3. Use the `ios-simulator` MCP tools to drive the app (`ui_tap`, `ui_describe_all`,
   `ui_swipe`) and `screenshot` the surface you changed.
4. **Actually look at the screenshot.** Confirm the specific visual claim in the task's
   "Expected" line. If you cannot see glass/blur/detents, the task is not done.
5. Commit.

---

### Task 0: Dependencies, prebuild, and a baseline

**Files:**
- Modify: `package.json`
- Modify: `app.config.ts`

- [ ] **Step 1: Install existing deps**

```bash
cd react-native && pnpm install
```

- [ ] **Step 2: Add the two new native deps at SDK-54-compatible versions**

```bash
npx expo install expo-glass-effect
pnpm add @lodev09/react-native-true-sheet
```

Expect `expo-glass-effect@~0.1.10` (the version SDK 54 bundles) and
`@lodev09/react-native-true-sheet@^3.11.4`. If `npx expo install` warns about a version
mismatch, take the version it recommends — do not force `latest`.

- [ ] **Step 3: Confirm the real exports before writing code against them**

Do not trust this plan's API sketches over the installed types. Read:
- `node_modules/expo-router/build/unstable-native-tabs/` — confirm whether SDK 54 exports
  the flat `{ NativeTabs, Icon, Label, Badge }` form or the compound
  `NativeTabs.Trigger.Icon` form. **SDK 54 is expected to be the flat form.**
- `node_modules/@lodev09/react-native-true-sheet/src/TrueSheet.types.ts` — confirm
  `detents`, `dimmed`, `grabber`, `scrollable`, `header`, `footer`.
- `node_modules/expo-glass-effect/` — confirm `GlassView`, `GlassContainer`,
  `isLiquidGlassAvailable`.

- [ ] **Step 4: Enable Android predictive back**

In `app.config.ts`, inside the `android` block:

```ts
  android: {
    softwareKeyboardLayoutMode: "pan",
    predictiveBackGestureEnabled: true,
    package: IS_DEV ? "com.nathanhadley.Cirque.dev" : "com.nathanhadley.Cirque",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff",
    },
  },
```

- [ ] **Step 5: Prebuild and run on the iOS 26 simulator**

```bash
APP_VARIANT=dev npx expo prebuild --clean
APP_VARIANT=dev npx expo run:ios --device "iPhone 17 Pro"
```

Pick any booted simulator on the **iOS 26.0** runtime (`xcrun simctl list runtimes | grep 26`).
This build takes several minutes; it is expected.

- [ ] **Step 6: Capture a BEFORE baseline**

Screenshot the map screen (tab bar + floating controls) and the ProblemSheet open over the
map. Save them — they are the "before" half of the PR body.

Expected: app launches, current JS tab bar with flat blur, current gluestack sheet.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml app.config.ts
git commit -m "chore: add expo-glass-effect and true-sheet, enable predictive back"
```

---

### Task 1: `GlassSurface`

The single runtime switch for glass. Everything else consumes this — no component may call
`isLiquidGlassAvailable()` directly.

**Files:**
- Create: `components/ui/GlassSurface.tsx`

**Interfaces:**
- Produces: `<GlassSurface variant?: "chrome" | "statusBar" | "control" style? tint? children />`
  and a re-export of `isLiquidGlassAvailable`.

- [ ] **Step 1: Write the component**

```tsx
import { Platform, StyleProp, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useColorScheme } from "nativewind";

export { isLiquidGlassAvailable };

type GlassSurfaceProps = {
  /** `control` = interactive floating button/bar. `chrome`/`statusBar` = passive backdrop. */
  variant?: "chrome" | "statusBar" | "control";
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode;
};

export function GlassSurface({
  variant = "chrome",
  style,
  className,
  children,
}: GlassSurfaceProps) {
  const { colorScheme } = useColorScheme();

  // iOS 26+: real Liquid Glass.
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView
        style={style}
        glassEffectStyle="regular"
        isInteractive={variant === "control"}
      >
        {children}
      </GlassView>
    );
  }

  // iOS < 26: blur fallback.
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={75}
        tint={colorScheme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
        style={style}
      >
        {children}
      </BlurView>
    );
  }

  // Android: Material elevated surface.
  return (
    <View
      className={`bg-background-0 ${className ?? ""}`}
      style={[{ elevation: variant === "control" ? 6 : 3 }, style]}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Migrate the two `position="statusBar"` call sites off `BlurBackground`**

`BlurBackground` cannot be deleted with the tab bar because of these. In
`screens/Contribute/index.tsx:171` and `screens/AboutScreen/index.tsx:134`, replace
`<BlurBackground position="statusBar" />` with a `GlassSurface` pinned to the top inset:

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassSurface } from "@/components/ui/GlassSurface";

// ...inside the component:
const insets = useSafeAreaInsets();

<GlassSurface
  variant="statusBar"
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: insets.top + 1,
    zIndex: 1,
  }}
/>
```

(`Contribute/index.tsx` already calls `useSafeAreaInsets()` — reuse it, don't add a second.)

- [ ] **Step 3: Verify in the simulator**

Rebuild, open the About tab, scroll content under the status bar, screenshot.

Expected: content is visibly frosted/refracted behind the status bar, not hidden behind an
opaque block. Compare light and dark mode (`xcrun simctl ui booted appearance dark`).

- [ ] **Step 4: Gate and commit**

```bash
pnpm check-all && pnpm test
git add components/ui/GlassSurface.tsx screens/Contribute/index.tsx screens/AboutScreen/index.tsx
git commit -m "feat: add GlassSurface with iOS 26 glass, blur, and Material fallbacks"
```

---

### Task 2: `NativeTabs`

**Files:**
- Modify: `app/(tabs)/_layout.tsx` (full rewrite)
- Delete: `components/HapticTab.tsx`
- Delete: `components/BlurBackground.tsx` (now unused — Task 1 moved its last call sites)

**Interfaces:**
- Consumes: nothing.
- Produces: a native tab bar. **`useBottomTabBarHeight()` from `@react-navigation/bottom-tabs`
  will no longer work** — `screens/MapScreen/index.tsx:43` and `screens/Contribute/index.tsx:31`
  both call it. Task 7 fixes MapScreen; fix Contribute here.

- [ ] **Step 1: Rewrite the tab layout**

Use the import form you confirmed in Task 0 Step 3. For SDK 54 (flat exports):

```tsx
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
        <Label>Map</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="about">
        <Icon sf={{ default: "info.circle", selected: "info.circle.fill" }} md="info" />
        <Label>About</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="contribute">
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} md="add_circle" />
        <Label>Contribute</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

The labels `Map`, `About`, `Contribute` are Maestro-asserted (Global Constraint 6) — keep
them exactly.

- [ ] **Step 2: Replace EVERY `useBottomTabBarHeight()` call — both of them, in this task**

`useBottomTabBarHeight()` comes from the Bottom Tab Navigator. The moment `NativeTabs`
replaces it, every call **throws** ("Couldn't find the bottom tab bar height"), and the app
renders a red screen instead of tabs. Both call sites must die in the same commit as the tab
swap — you cannot defer one to a later task or the app is broken in between:

- `screens/Contribute/index.tsx:31`
- `screens/MapScreen/index.tsx:43`

In both, drop the import and the hook, and use the safe-area inset instead — under
edge-to-edge, the native tab bar reports its height through the bottom inset:

```tsx
// Remove: import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
// Remove: const tabBarHeight = useBottomTabBarHeight();
const insets = useSafeAreaInsets();
```

Then replace every `tabBarHeight` reference with `insets.bottom`. In `MapScreen` this also
kills the `bottomOffset` line:

```tsx
// Remove: const bottomOffset = Platform.OS === "ios" ? tabBarHeight : 0;
```

That `: 0` was always wrong on Android under edge-to-edge; `insets.bottom` is correct on
both platforms. Use it directly for the floating buttons' `bottom` offsets. Read each file
and fix each usage — do not guess at line numbers.

- [ ] **Step 3: Delete the dead components**

```bash
git rm components/HapticTab.tsx components/BlurBackground.tsx
```

Then `grep -rn "HapticTab\|BlurBackground" --include="*.tsx" .` and confirm **zero** hits.

- [ ] **Step 4: Verify in the simulator**

Rebuild (native change — a JS reload is not enough). Screenshot the tab bar. Then open the
About tab, scroll down, and screenshot again.

Expected: the tab bar is a floating Liquid Glass pill (iOS 26), map content visibly refracts
through it, and it **minimizes/hides as you scroll down** (`minimizeBehavior`). Tapping each
of Map / About / Contribute switches tabs. If `NativeTabs` throws or renders nothing, stop
and report — the fallback (Global Constraint: keep JS `Tabs` + `GlassSurface` in
`tabBarBackground`) is a decision for the human, not for you.

- [ ] **Step 5: Gate and commit**

```bash
pnpm check-all && pnpm test
git add -A
git commit -m "feat: replace JS tab bar with NativeTabs (Liquid Glass on iOS, Material 3 on Android)"
```

---

### Task 3: The `Sheet` wrapper

**Files:**
- Create: `components/ui/sheet/index.tsx`

**Interfaces:**
- Produces:
  - `<Sheet ref detents dimmed grabber header footer scrollable onDismiss>` — thin wrapper.
  - `<SheetHeader title onClose closeButtonTestID />` — the **replacement for
    `ActionsheetHeader`**, carrying the Maestro `close-*` testIDs forward.
  - `type SheetRef = { present: (index?: number) => Promise<void>; dismiss: () => Promise<void>; resize: (index: number) => Promise<void> }`

- [ ] **Step 1: Write the wrapper**

Note what is deliberately **absent**: no `backgroundColor`, no `backgroundBlur` on iOS 26.
That absence is what turns Liquid Glass on (Global Constraint 3).

```tsx
import React from "react";
import { Platform, Pressable, View } from "react-native";
import { TrueSheet, type TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { X } from "lucide-react-native";
import { isLiquidGlassAvailable } from "@/components/ui/GlassSurface";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export type SheetRef = TrueSheet;

export function Sheet({ children, ...props }: TrueSheetProps & { ref?: React.Ref<TrueSheet> }) {
  // Liquid Glass is enabled by DEFAULT on iOS 26+ and is disabled the moment a
  // backgroundColor or backgroundBlur is set. Only style the background where
  // glass is unavailable.
  const background: Partial<TrueSheetProps> = isLiquidGlassAvailable()
    ? {}
    : Platform.OS === "ios"
      ? { backgroundBlur: "system-material" }
      : {};

  return (
    <TrueSheet grabber cornerRadius={24} {...background} {...props}>
      {children}
    </TrueSheet>
  );
}

type SheetHeaderProps = {
  title: string;
  onClose: () => void;
  closeButtonTestID?: string;
};

export function SheetHeader({ title, onClose, closeButtonTestID }: SheetHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
      <Text className="text-xl font-semibold text-typography-900">{title}</Text>
      <Pressable
        testID={closeButtonTestID}
        accessibilityLabel={`Close ${title}`}
        onPress={onClose}
        hitSlop={12}
        android_ripple={{ borderless: true, radius: 20 }}
      >
        <Icon as={X} size="xl" />
      </Pressable>
    </View>
  );
}
```

On Android, leave the background unset so the native `BottomSheetDialog` supplies the
Material surface.

- [ ] **Step 2: Make sheet failures loud**

`present()` and `dismiss()` return promises that reject if the native sheet can't be
presented. An unhandled rejection here shows up as a dead tap, which is the worst possible
failure mode to debug. In the `useEffect` bridges (Tasks 4–6), attach a rejection handler:

```tsx
sheet.current?.present().catch((e: unknown) => console.error("Sheet present failed", e));
```

Do not wrap this in a helper or a try/catch ceremony — one `.catch` at each call site is
the whole fix.

- [ ] **Step 3: Verify it compiles against the real types**

```bash
pnpm typecheck
```

If `TrueSheetProps` doesn't accept a `ref` in this form, or the grabber/cornerRadius names
differ, **read the installed `.d.ts` and correct this wrapper** — the installed types win
over this plan.

- [ ] **Step 4: Commit**

```bash
pnpm check-all && pnpm test
git add components/ui/sheet/index.tsx
git commit -m "feat: add native Sheet wrapper over TrueSheet"
```

---

### Task 4: Migrate `ProblemSheet` (riskiest — do it first)

This is the sheet the whole design hinges on: it sits over the map, must **not** dim it, and
the map must stay pannable behind it.

**Files:**
- Modify: `screens/MapScreen/ProblemSheet/index.tsx`
- Modify: `screens/MapScreen/index.tsx` (it drives the sheet's open state)

**Interfaces:**
- Consumes: `Sheet`, `SheetRef` from Task 3.
- Note: TrueSheet is **imperative** (`ref.present()` / `ref.dismiss()`), while the current
  code is **declarative** (`isOpen` prop). Bridge with an effect; do not fight the API.

- [ ] **Step 1: Rewrite `ProblemSheet`**

Keep `ProblemDescription` exactly as it is. Replace the `Actionsheet` shell:

```tsx
export function ProblemSheet({ problem, isOpen, onClose }: ProblemSheetProps) {
  const sheet = useRef<SheetRef>(null);

  useEffect(() => {
    if (isOpen && problem) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [isOpen, problem]);

  if (!problem) return null;

  return (
    <Sheet
      ref={sheet}
      detents={[0.5, 1]}
      dimmed={false}
      scrollable
      onDidDismiss={onClose}
    >
      <View className="w-full aspect-[4/3] overflow-hidden bg-typography-300 relative">
        <Topo
          topo={problem.topo || ""}
          remoteUri={topoImageUrl(problem.topoKey, "full")}
          line={problem.line}
          color={problem.color}
        />
        {problem.order !== undefined && (
          <View className="absolute inset-0 justify-center">
            <CircuitNavButtons />
          </View>
        )}
      </View>
      <ProblemDescription problem={problem} />
    </Sheet>
  );
}
```

`dimmed={false}` is what keeps the map live. Delete the
`Platform.OS === "ios" ? <ActionsheetScrollView> : <plain>` fork and its comment — the
`scrollable` prop handles Android correctly, which was the whole reason for that hack.

- [ ] **Step 2: Update the call site**

In `screens/MapScreen/index.tsx`, drop the now-meaningless props:

```tsx
<ProblemSheet
  problem={problem}
  isOpen={viewProblem && problem !== null}
  onClose={() => setViewProblem(false)}
/>
```

(`closeOnOverlayClick` and `snapPoints` were gluestack props; they no longer exist.)

- [ ] **Step 3: Verify in the simulator — the money shot**

Rebuild. Then, with the MCP tools:
1. `ui_tap` a problem on the map → sheet presents at the **half** detent.
2. **`ui_swipe` on the map area still visible above the sheet.** Screenshot before and after.
3. `ui_swipe` up on the sheet → it expands to full.
4. `ui_swipe` down → it dismisses.

Expected: the map **visibly pans** in step 2 while the sheet stays put (this proves
`dimmed={false}` works and is the single most important check in the plan). The sheet
background shows Liquid Glass — map content refracting through it, not a flat white panel.
If the panel is flat/opaque, a `backgroundColor` leaked in somewhere (Global Constraint 3).
The `circuit-previous-problem` / `circuit-next-problem` buttons still work.

- [ ] **Step 4: Gate and commit**

```bash
pnpm check-all && pnpm test
git add screens/MapScreen/ProblemSheet/index.tsx screens/MapScreen/index.tsx
git commit -m "feat: ProblemSheet on native TrueSheet with non-dimmed map interaction"
```

---

### Task 5: Migrate `GradeFilterSheet`

**Files:**
- Modify: `screens/MapScreen/GradeFilterSheet.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetHeader`, `SheetRef`.
- Preserves: testIDs `close-grade-filter`; copy `"Adjust grade range"`, `"Reset"`, `"V0"`,
  `"V10"`.

- [ ] **Step 1: Swap the shell**

Keep all slider logic and `handleReset` / `handleClose` untouched. Replace only the
`Actionsheet`/`ActionsheetBackdrop`/`ActionsheetContent`/`ActionsheetHeader` shell:

```tsx
const sheet = useRef<SheetRef>(null);

useEffect(() => {
  if (isOpen) sheet.current?.present();
  else sheet.current?.dismiss();
}, [isOpen]);

return (
  <Sheet ref={sheet} detents={["auto"]} onDidDismiss={handleClose}>
    <VStack className="w-full" style={{ paddingBottom: bottom + 16 }}>
      <SheetHeader
        title="Adjust grade range"
        onClose={handleClose}
        closeButtonTestID="close-grade-filter"
      />
      {/* ...existing slider VStack, unchanged... */}
    </VStack>
  </Sheet>
);
```

`detents={["auto"]}` sizes the sheet to its content — no more hardcoded height guessing.

- [ ] **Step 2: Verify in the simulator**

`ui_tap` `open-grade-filter` → sheet presents, sized to content. Drag both slider thumbs.
Tap `"Reset"`. Tap `close-grade-filter`. Screenshot.

Expected: sheet is glass, hugs its content, sliders drag smoothly (they are inside a native
sheet now — confirm the gesture isn't being eaten by the sheet's own drag handling; if it
is, that's a real bug, report it).

- [ ] **Step 3: Gate and commit**

```bash
pnpm check-all && pnpm test
git add screens/MapScreen/GradeFilterSheet.tsx
git commit -m "feat: GradeFilterSheet on native TrueSheet"
```

---

### Task 6: Migrate the Contribute pickers

**Files:**
- Modify: `screens/Contribute/AreaPicker.tsx`
- Modify: `screens/Contribute/GradePicker.tsx`
- Modify: `screens/Contribute/ProblemPicker.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetHeader`, `SheetRef`.
- Preserves testIDs: `close-area-picker`, `close-grade-picker`, `area-option-*`.
- Preserves copy: `"Select area"`, `"Select grade"`.

- [ ] **Step 1: `AreaPicker`**

This one has a **footer** (`BottomSearchBar`) that must stay pinned above the keyboard —
that's exactly what TrueSheet's `footer` prop is for. Use it instead of stacking the search
bar after a scroll view:

```tsx
<Sheet
  ref={sheet}
  detents={[0.6, 1]}
  scrollable
  onDidDismiss={onClose}
  footer={
    <BottomSearchBar
      placeholder="Search areas..."
      value={searchTerm}
      onChangeText={setSearchTerm}
    />
  }
>
  <SheetHeader title="Select area" onClose={onClose} closeButtonTestID="close-area-picker" />
  <Divider />
  {/* existing RadioGroup, unchanged — keep every area-option-* testID */}
</Sheet>
```

Delete the `ActionsheetScrollView` and its `h-[60vh]` hack; `detents` + `scrollable` do this
natively now.

- [ ] **Step 2: `GradePicker`**

Straight shell swap. The `WheelPicker` and all grade logic stay as-is.

```tsx
<Sheet ref={sheet} detents={["auto"]} onDidDismiss={handleClose}>
  <SheetHeader title="Select grade" onClose={handleClose} closeButtonTestID="close-grade-picker" />
  <View className="pb-6">{/* existing WheelPicker, unchanged */}</View>
</Sheet>
```

**Watch for a gesture conflict:** `react-native-wheely` is a scroll-driven picker inside a
draggable native sheet. If spinning the wheel drags the sheet instead, set
`scrollableOptions={{ scrollingExpandsSheet: false }}`. Verify this specifically.

- [ ] **Step 3: `ProblemPicker`**

This one is different from the other two and has a real trap in it: its body is a
**`FlashList`** (not a `ScrollView`), and it uses `snapPoints={[80]}` (80% height) with a
`BottomSearchBar` pinned at the bottom. It has **no** close button, so no close testID to
preserve — but the heading `"Use Existing Topo"` and the placeholder `"Search problems..."`
must stay.

`TrueSheet`'s `scrollable` prop expects a scrollable child it can coordinate with. A
`FlashList` inside a draggable sheet will fight the sheet's drag gesture. Structure it as:

```tsx
const sheet = useRef<SheetRef>(null);

useEffect(() => {
  if (isOpen) sheet.current?.present();
  else sheet.current?.dismiss();
}, [isOpen]);

return (
  <Sheet
    ref={sheet}
    detents={[0.8]}
    scrollableOptions={{ scrollingExpandsSheet: false }}
    onDidDismiss={handleClose}
    footer={
      <BottomSearchBar
        placeholder="Search problems..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    }
  >
    <VStack className="w-full px-4 pt-4 pb-2" space="md">
      <Heading size="lg" className="text-typography-900">
        Use Existing Topo
      </Heading>
      <Text className="text-typography-600 -mt-2">
        Search for an existing problem to use its topo image
      </Text>
    </VStack>

    <View className="flex-1 px-4 w-full">
      {/* existing FlashList, unchanged */}
    </View>
  </Sheet>
);
```

`scrollingExpandsSheet: false` stops the list's scroll from being hijacked to expand the
sheet. **Verify this by actually scrolling the list in the simulator** — if the sheet grows
instead of the list scrolling, this prop didn't take and you need to report it rather than
paper over it.

- [ ] **Step 4: Verify all three in the simulator**

`ui_tap` `open-area-picker` → scroll the list, type in the search footer (**confirm the
footer rises with the keyboard**), select an area, close via `close-area-picker`.
Then `open-grade-picker` → spin the wheel (**confirm the sheet does not drag**), close.
Then the problem picker. Screenshot each.

- [ ] **Step 5: Gate and commit**

```bash
pnpm check-all && pnpm test
git add screens/Contribute/AreaPicker.tsx screens/Contribute/GradePicker.tsx screens/Contribute/ProblemPicker.tsx
git commit -m "feat: Contribute pickers on native TrueSheet"
```

---

### Task 7: Glass map controls

**Files:**
- Modify: `components/MapSearchBar.tsx`
- Modify: `components/buttons/FilterButton.tsx`
- Modify: `components/buttons/LocateMeButton.tsx`
- Modify: `screens/MapScreen/index.tsx`

**Interfaces:**
- Consumes: `GlassSurface`, `isLiquidGlassAvailable` from Task 1.
- Preserves testIDs: `open-problem-search`, `open-grade-filter`, `problem-map`.

- [ ] **Step 1: Put the search bar on glass**

In `MapSearchBar.tsx`, wrap the pressable row in a `GlassSurface variant="control"` with a
pill radius, and drop the `bg-typography-100` fill from the `Input` (a solid fill defeats
the glass). Keep `testID="open-problem-search"` and the placeholder `"Search problems..."`
exactly.

- [ ] **Step 2: Group the two round buttons in a `GlassContainer`**

In `screens/MapScreen/index.tsx`, the filter and locate buttons are currently two absolutely
positioned buttons 56px apart. Put them in one `GlassContainer` so iOS 26 merges/morphs them
as a group, the way native map controls do:

```tsx
import { GlassContainer, isLiquidGlassAvailable } from "expo-glass-effect";

// ...replacing the two separate absolute-positioned buttons:
<View className="absolute right-4" style={{ bottom: insets.bottom + 16 }}>
  {isLiquidGlassAvailable() ? (
    <GlassContainer spacing={12} style={{ gap: 12 }}>
      <FilterButton
        testID="open-grade-filter"
        accessibilityLabel="Adjust grade filter"
        onPress={() => setIsFilterVisible(true)}
      />
      <LocateMeButton onPress={centerToUserLocation} />
    </GlassContainer>
  ) : (
    <View style={{ gap: 12 }}>
      <FilterButton
        testID="open-grade-filter"
        accessibilityLabel="Adjust grade filter"
        onPress={() => setIsFilterVisible(true)}
      />
      <LocateMeButton onPress={centerToUserLocation} />
    </View>
  )}
</View>
```

Each button's internals become a `GlassSurface variant="control"` circle instead of a
gluestack `Button` with `shadow-md`.

- [ ] **Step 3: Verify in the simulator**

Screenshot the map screen in **light and dark** mode. Then pan the map so dark terrain sits
under the controls, and screenshot again.

Expected: the search bar and buttons are visibly translucent and **refract the map moving
underneath them** — the tell that it's real glass rather than a grey fill. On iOS 26 the two
round buttons should read as a merged glass group. Both still tap through to their sheets.

- [ ] **Step 4: Gate and commit**

```bash
pnpm check-all && pnpm test
git add components/MapSearchBar.tsx components/buttons/ screens/MapScreen/index.tsx
git commit -m "feat: glass map controls with grouped GlassContainer"
```

---

### Task 8: Android nativeness polish

**Files:**
- Modify: `components/buttons/CircuitNavButtons.tsx`
- Modify: `components/buttons/FilterButton.tsx`, `components/buttons/LocateMeButton.tsx`

- [ ] **Step 1: Enable haptics on Android**

`CircuitNavButtons.tsx` already calls `Haptics.impactAsync` unconditionally — good, leave it.
But confirm no remaining `process.env.EXPO_OS === "ios"` haptic guards survive anywhere:

```bash
grep -rn "EXPO_OS" --include="*.tsx" --include="*.ts" . | grep -v node_modules
```

Expected: zero hits (the only one lived in the deleted `HapticTab.tsx`).

- [ ] **Step 2: Add ripple feedback to the floating buttons**

The map buttons fade on press (iOS idiom). On Android they should ripple. In each button
component, pass `android_ripple={{ borderless: true, radius: 24 }}` to the underlying
pressable.

- [ ] **Step 3: Verify on an Android emulator**

```bash
APP_VARIANT=dev npx expo run:android
```

Screenshot: bottom nav is Material 3 (ripple on tap, correct elevation), sheets are native
`BottomSheetDialog` (drag to dismiss works), floating buttons ripple, and the predictive-back
gesture animates the sheet out rather than snapping.

- [ ] **Step 4: Gate and commit**

```bash
pnpm check-all && pnpm test
git add -A
git commit -m "feat: Android ripple feedback and haptics parity"
```

---

### Task 9: Cleanup, Maestro, and final verification

**Files:**
- Delete: `components/ui/actionsheet/`
- Modify: `package.json`

- [ ] **Step 1: Remove the dead gluestack actionsheet**

```bash
grep -rn "ui/actionsheet" --include="*.tsx" . | grep -v node_modules
```

Expected: zero hits. Then:

```bash
git rm -r components/ui/actionsheet
```

Also check whether `expo-blur` is still used (`GlassSurface` uses it for the iOS < 26
fallback, so it should stay — **do not remove it**).

- [ ] **Step 2: Run the full Maestro suite on Android**

This is the regression net for all 20 testIDs (Global Constraint 4).

```bash
maestro test .maestro/
```

Expected: all five flows pass. **If any flow fails, a testID or a piece of asserted copy was
dropped — fix it, do not edit the Maestro flow to match.**

- [ ] **Step 3: Run the Maestro suite on the iOS 26 simulator too**

```bash
maestro test .maestro/ --platform ios
```

The flows declare `appId: com.nathanhadley.Cirque`; the dev build is
`com.nathanhadley.Cirque.dev`. Run against a non-dev build, or override the appId — do not
permanently change the flows.

- [ ] **Step 4: Full gate**

```bash
pnpm check-all && pnpm test
```

- [ ] **Step 5: Capture the AFTER screenshots**

Same shots as the Task 0 baseline, for the PR body: tab bar, map with glass controls,
ProblemSheet open over a live map — in **both** light and dark mode.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove gluestack actionsheet"
```

---

## Definition of Done

- [ ] All five gluestack `Actionsheet` call sites are gone; `components/ui/actionsheet/` deleted.
- [ ] `BlurBackground` and `HapticTab` deleted; zero references remain.
- [ ] Tab bar is `NativeTabs` and renders Liquid Glass on the iOS 26 simulator.
- [ ] `ProblemSheet` presents at a half detent **with the map still pannable behind it** —
      verified by a before/after screenshot of a map pan, not by assertion.
- [ ] Map controls visibly refract map content moving underneath them.
- [ ] All 5 Maestro flows pass on Android; all 20 testIDs intact.
- [ ] `pnpm check-all` and `pnpm test` pass.
- [ ] Before/after screenshots captured in light and dark mode.
- [ ] **`git diff --stat main` shows more lines deleted than added.** If it doesn't, you
      ported a workaround you should have deleted (Global Constraint 11). Go find it.
