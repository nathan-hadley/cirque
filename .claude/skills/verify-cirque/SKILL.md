---
name: verify-cirque
description: Build, launch, and drive the Cirque React Native app (react-native/) on a dedicated iOS simulator and Android emulator with Maestro, capturing screenshots, JUnit reports, and logcat as proof. Use when asked to verify, smoke test, or prove an app change works on iOS or Android, or to screenshot the app on a sim/emulator.
---

# Verify Cirque on iOS and Android

Cirque is an Expo app (`react-native/`) with a Mapbox map, a problem search, circuit navigation, a grade filter, and a Contribute form. Verification runs a release build (prod bundle id `com.nathanhadley.Cirque`, JS embedded, no Metro) on a simulator and an emulator this skill creates and destroys, and drives them with the Maestro flows in `react-native/.maestro/`. Those are the same flows CI runs in `.github/workflows/maestro-smoke.yml`.

Everything goes through one helper, run from the repo root:

```sh
node .claude/skills/verify-cirque/scripts/verify.ts <command> <ios|android|all> [args]
```

Commands: `build`, `boot [--window]`, `install`, `doctor`, `test [flow ...]`, `screenshot [path]`, `cleanup`. Run state lives in `.tmp/verify-cirque/state.json` (`.tmp/` is gitignored), evidence in `.tmp/verify-cirque/artifacts/`.

## Prerequisites

- macOS with Xcode and an iOS simulator runtime, the Android SDK at `$ANDROID_HOME` (default `~/Library/Android/sdk`) with at least one AVD, `maestro` on `PATH`, `pnpm`, and Node 22.18+ (runs the `.ts` helper directly).
- `react-native/.env.local` with `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_KEY`. A fresh worktree doesn't have it: copy it from the main checkout (`cp <main-checkout>/react-native/.env.local react-native/`). Without the Mapbox token the map renders blank and the map-tap flow fails.

## Launch

1. Build once per code change. Builds take 5-15 minutes cold and a minute or two warm, so run them in the background and run both platforms in parallel:

   ```sh
   node .claude/skills/verify-cirque/scripts/verify.ts build android
   node .claude/skills/verify-cirque/scripts/verify.ts build ios
   ```

   If `node_modules` is missing or wasn't installed with babel hoisting, `build` reinstalls with pnpm 10 (`npx pnpm@10`). pnpm 11+ ignores the `public-hoist-pattern` in `react-native/.npmrc`, and the JS bundle step then fails with `Cannot find module '@babel/plugin-transform-react-jsx'`. It also passes `IPHONEOS_DEPLOYMENT_TARGET=15.1` to `xcodebuild`, because Xcode 27 rejects pods that still declare 9.0-14.0.

   `build` runs `expo prebuild` without `APP_VARIANT` (so the native projects are the prod `Cirque`, not `Cirque Dev`), then `xcodebuild` Release for the simulator SDK or `gradlew assembleRelease` for arm64. If `ios/` or `android/` holds a dev-variant project, prebuild runs with `--clean` and regenerates it. Outputs: `react-native/ios/build/Build/Products/Release-iphonesimulator/Cirque.app` and `react-native/android/app/build/outputs/apk/release/app-release.apk`. Ready when the command prints `Built <path>` and exits 0.

2. Boot dedicated devices. These run alongside anything the user already has open:

   ```sh
   node .claude/skills/verify-cirque/scripts/verify.ts boot all
   ```

   iOS creates a new simulator named `cirque-verify-<timestamp>` (`CIRQUE_IOS_DEVICE`, default `iPhone 17 Pro`, on the newest iOS runtime) and waits for boot, about a minute. Android starts the first AVD from `emulator -list-avds` (override with `CIRQUE_AVD`) on port 5584, so its serial is always `emulator-5584`, with `-read-only -no-snapshot-save -no-window`. Read-only means nothing the run does persists into the AVD, and it can run while the user has the same AVD open. Pass `--window` to watch either device. Ready when it prints `... ready: <id>`.

3. Install the build: `node .claude/skills/verify-cirque/scripts/verify.ts install all`. Reinstall after every rebuild.

`boot` refuses to start if `state.json` already records a device for that platform, or if something else already holds `emulator-5584`. Don't work around that. Run `doctor`, and if the recorded device is dead, `cleanup` first.

## Doctor

```sh
node .claude/skills/verify-cirque/scripts/verify.ts doctor all
```

Read-only. Checks maestro and `.env.local`, that each release build exists, which commit it was built from compared to `HEAD` (a `warn` means rebuild if `react-native/` changed since), that the run's own simulator/emulator is booted, and that `com.nathanhadley.Cirque` is installed on it. It also prints the emulator's `wifi_on`, since the contribute flow leaves it offline. Run it first, and again whenever a flow fails in a way that looks environmental. Exit code 1 means something's `FAIL`.

## Drive

Maestro is the harness. Run the repo's flows through the helper, which pins `--device` to the run's own simulator/emulator:

```sh
node .claude/skills/verify-cirque/scripts/verify.ts test android
node .claude/skills/verify-cirque/scripts/verify.ts test ios
node .claude/skills/verify-cirque/scripts/verify.ts test android 02-search 04-grade-filter
node .claude/skills/verify-cirque/scripts/verify.ts test android 05-contribute
```

With no flow names it runs the platform defaults: Android runs 01-04, iOS runs 01, 02, and 04. Names resolve to `react-native/.maestro/<name>.yml`, and an argument containing a `/` is taken as a path, for ad-hoc flows.

To prove a change the repo flows don't cover, write a scratch flow in `.tmp/verify-cirque/flows/` and run it by path. Start it from the shared launch subflow, which relaunches with `clearState: true` and waits for the map's search bar:

```yaml
appId: com.nathanhadley.Cirque
---
- runFlow: ../../../react-native/.maestro/subflows/launch.yml
- tapOn:
    id: open-grade-filter
- assertVisible: "Adjust grade range"
- takeScreenshot: grade-filter-open
```

Prefer `id:` (React Native `testID`) and visible text over `point:` taps. The map is a native Mapbox view with no element tree, so tapping a marker is the one place a point is unavoidable (see `features/circuits.md`). `maestro --device <id> hierarchy` dumps the current element tree when you need a handle. The full list of handles is in `features/`.

If a flow should become permanent coverage, add it to `react-native/.maestro/` and to the CI `maestro test` line instead of leaving it in `.tmp/`.

### Platform differences

- `03-map-and-circuit` uses `pressKey: back` to dismiss the problem sheet, which only exists on Android. It's excluded from the iOS defaults. On iOS, prove circuit navigation with a scratch flow that stops before the back press.
- `05-contribute` is Android only, and never in a default run. Online, a submit posts a real `pending` problem to the production API and emails the admin. The helper turns the emulator's wifi and mobile data off before running it, so the submit takes the offline queue path (`Problem saved - will submit when online`). It leaves the emulator offline afterwards, because reconnecting lets the app flush the queued submission to prod. `cleanup android` throws the queued submission away with the read-only emulator. The iOS simulator shares the Mac's network and has no per-device toggle, so the helper refuses `05-contribute` on iOS.
- iOS doesn't expose the `testID` of text inputs built on gluestack's `InputField` (search, and every Contribute field). Maestro sees them as `Input Field` with no id. `02-search` gets by because the search input autofocuses and its tap is `optional`. On iOS, reach such a field by tapping the visible label or placeholder next to it, and confirm with `maestro --device <udid> hierarchy`.
- After the contribute flow, the emulator is offline for the rest of its life. Run 05 last or in its own boot.

## Evidence

Each `test` run writes to `.tmp/verify-cirque/artifacts/<timestamp>-<platform>/`:

- `report.xml`, the JUnit result per flow
- `final.png`, the screen after the last flow
- `screenshots/<name>.png` for each `takeScreenshot: <name>` in the flows
- `<date>_<time>/`, Maestro's per-flow command log (`commands-(<flow name>).json`) and a `screenshot-❌-...png` for each failed flow
- `logcat.txt` on Android

`screenshot <platform> [path]` grabs the current screen at any point.

Proof standards:

- Exercise the user path. Tap what a user taps and type what they type. Don't prove a feature by calling a store setter, deep-linking past the UI, or editing `seed.json`.
- Capture the action and the resulting state. Add `takeScreenshot:` before and after the step that matters, not just the final screen.
- Verify side effects alongside what's visible. For a contribute submission, the toast proves the app queued it. Proving it reached the API means checking the admin portal, and that only happens with a real, deliberate submission the user asked for.
- Problem data comes from the bundled seed (`react-native/assets/seed.json`) on first launch, then a refresh from the production API (`GET /v1/data`, read-only). Assertions on seeded names like `The Shallow` hold either way.
- Report each platform separately. Passing on Android isn't proof for iOS, and the reverse.

## Cleanup

```sh
node .claude/skills/verify-cirque/scripts/verify.ts cleanup all
```

Shuts down and deletes the run's simulator (by UDID) and stops the run's emulator (`adb -s emulator-5584 emu kill`, then its recorded PID if it hangs). It only touches devices recorded in `state.json`, never anything matched by name, and it never deletes `.tmp/verify-cirque/artifacts/`. Run it after every attempt, failed ones included. The build outputs in `react-native/ios` and `react-native/android` stay (gitignored) so the next run skips the cold build.

If `state.json` is lost while devices are still up, find them by what this skill named them: `xcrun simctl list devices | grep cirque-verify-` gives the UDID to `simctl delete`, and `adb -s emulator-5584 emu kill` stops the emulator. Leave every other simulator and emulator alone.

## Gotchas

- Maestro's iOS driver installs its own XCTest runner on first use. The first iOS `test` on a new simulator takes an extra minute or so before the first command.
- `launchApp` with `clearState: true` wipes app data each flow. A flow that depends on state from an earlier one has to recreate it.
- The problem detail is a native sheet (TrueSheet). Wait for its content with `extendedWaitUntil`, never a fixed sleep.
- A JS-only change still needs `build` again. The release binary embeds the bundle, there's no Metro to hot reload.
- Native module or `app.config.ts` changes regenerate `ios/` and `android/` on the next `build`. If a build fails in a stale native project, delete that directory and build again.
- CI runs Maestro 2.6.1 on an x86_64 API 35 Pixel 6. Locally it's whatever `maestro --version` and your AVD are, so a local pass with a different setup is strong evidence, not a guarantee of green CI.

## Feature map

`features/README.md` indexes the user-facing features and how to prove each. Read the matching file before driving a feature, and cover every entry point it lists.
