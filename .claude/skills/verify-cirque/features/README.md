# Cirque verification map

This directory is the maintained source for verifying Cirque's user-facing behavior on iOS and Android. Read the index, then use the matching feature file as the recipe. Commands assume the repo root as the working directory and `verify.ts` meaning `node .claude/skills/verify-cirque/scripts/verify.ts`.

## Baseline preconditions

- A release build of the current code is installed on the run's own devices (`verify.ts build`, `boot`, `install`).
- `verify.ts doctor <platform>` passes for each platform being proved.
- Every flow starts from `react-native/.maestro/subflows/launch.yml`, which relaunches with cleared app data and waits for `Search problems...` on the Map tab.
- The device is online, except for the contribute submit, which runs offline on Android only.

## Driving conventions

- Prefer `id:` handles (React Native `testID`) and exact visible text. The handles each feature file names are the stable ones.
- Wait for sheets and network-backed content with `extendedWaitUntil`, never a fixed sleep.
- Run repo flows by name (`verify.ts test android 02-search`) and scratch flows by path from `.tmp/verify-cirque/flows/`.
- Map markers have no element handle. Tap them by `point:` only after the app has centered the target problem.

## Proof and skip reporting

- Prove each platform separately and say which platform each artifact came from.
- Capture the step that matters with `takeScreenshot:` plus the JUnit report from the run directory.
- Report an entry point you couldn't drive, with the reason, instead of covering it through a different entry point.
- `05-contribute` never runs online and never on iOS. Say so when the proof stops at the offline queue.

## Feature entry contract

Each feature file opens with an H1 and one paragraph on the user-visible behavior, then four H2s in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with Maestro`, `Gotchas`.

## Features

- [Tabs](./tabs.md) covers launch and moving between the Map, About, and Contribute tabs.
- [Problem search](./search.md) covers opening search, finding a problem by name, and opening its detail sheet.
- [Circuits](./circuits.md) covers starting a circuit from About, stepping through it, and reopening a problem from its map marker.
- [Grade filter](./grade-filter.md) covers opening the filter sheet, the range slider, reset, and close.
- [Contribute](./contribute.md) covers form validation, the grade and area pickers, coordinates, and the offline submit.
