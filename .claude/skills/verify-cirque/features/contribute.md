# Contribute

The Contribute tab is a form for submitting a problem that isn't in the app. Required fields are validated on submit. Online, a submission posts to the Cirque API as a pending problem for admin review. Offline, the app queues it and submits on reconnect.

## Sub-features

- `contribute-validate` submitting an empty form shows `Please fill out all required fields.`
- `contribute-pickers` the grade and area pickers open as sheets and set their fields.
- `contribute-coordinates` latitude and longitude accept typed values, or `Use my location`.
- `contribute-photo` `Select Photo` attaches a topo image.
- `contribute-submit-offline` submitting offline shows `Problem saved - will submit when online`.
- `contribute-submit-online` submitting online shows `Problem submitted successfully - we'll review it shortly`.

## How to get to it (user POV)

- Tap `Contribute` in the tab bar.
- On About, the `Contribute` row under `Get Involved`.

## Driving it with Maestro

Preconditions:

- Baseline preconditions from the index.
- Android only. `verify.ts test android 05-contribute` turns wifi and data off on the emulator first.

- **All of it.** Run `verify.ts test android 05-contribute`. JUnit marks `Validate and submit a contributed problem` passed.
- **Validation.** `scrollUntilVisible` to `{ id: submit-problem }`, tap it, `assertVisible: "Please fill out all required fields."`.
- **Contact fields.** `contact-name-input`, `contact-email-input`. Dismiss the keyboard by tapping a section label such as `Contact information`.
- **Problem fields.** `problem-name-input`; `open-grade-picker` shows `Select grade`, closed with `close-grade-picker` (defaults to V3); `open-area-picker` shows `Select area`, pick `area-option-forestland`, close with `close-area-picker`.
- **Coordinates.** `latitude-input` and `longitude-input`, for example `47.596` and `-120.661`.
- **Description.** `problem-description-input`.
- **Submit offline.** `tapOn: { id: submit-problem }` then `assertVisible: "Problem (submitted successfully|saved).*"`. Offline it's the `saved` toast.
- **Proof.** `takeScreenshot:` on the validation error and on the saved toast.

## Gotchas

- Online submits create a real pending problem in production D1 and email the admin. Only do that when the user explicitly asks, and then report the submission so they can reject it in the admin portal.
- The helper leaves the emulator offline after this flow, because reconnecting would flush the queued submission to production. `verify.ts cleanup android` discards it with the read-only emulator.
- The iOS simulator has no per-device network toggle, so the helper refuses `05-contribute` on iOS. Validation and pickers can still be proved on iOS with a scratch flow that stops before the final submit, but the text inputs have no id on iOS (they show up as `Input Field`), so tap them by their visible placeholder or label.
- `hideKeyboard` on Android presses back, which leaves the tab when the keyboard is already down. Tap a section label instead.
- `Use my location` and `Select Photo` open system permission prompts and pickers that the repo flows don't drive.
