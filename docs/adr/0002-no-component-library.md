# ADR 0002: No Component Library, Native Controls, NativeWind 5

- **Status:** Accepted
- **Date:** 2026-09-12
- **Deciders:** Nathan Hadley

## Context

The app's UI is gluestack copy-in components vendored in `react-native/components/ui/`: 16 component dirs plus `GlassSurface`. "Copy-in" describes how they're authored, not how they're coupled. 27 of those files import `@gluestack-ui/core` and `@gluestack-ui/utils` at runtime. The theme is gluestack's default palette, and radii are hard-coded `rounded-*` strings per file, so there's no radius token. That's why the app reads as the stock template.

We're re-skinning the app to the "Sender" identity ([#71](https://github.com/nathan-hadley/cirque/issues/71)), so the component foundation needed a decision first. The options researched in [#72](https://github.com/nathan-hadley/cirque/issues/72) were gluestack, react-native-reusables (RNR), and building our own, all on NativeWind.

- Current gluestack (v5) requires `nativewind@^5.0.0-preview.4`. Its upgrade path is "re-add components," which overwrites the style edits the re-skin depends on.
- RNR fits the token model (about 20 semantic vars, with one `--radius`), but it's effectively one maintainer, and it brings a CLI plus an `@rn-primitives` layer.
- Behavior is used at only about 27 import sites: button, input, radio, slider, badge, toast, sheet. Everything else is layout and typography wrappers. The app barely needs a component library.

## Decision

**No component library.** We own a small set of thin, tokenized primitives in `components/ui/`, and they carry the brand: Text, Heading, Button, Badge, Input, plus `GlassSurface`. We also keep light layout wrappers (`HStack`, `VStack`, `Center`, `Divider`), rewritten as plain `View`s with default classes that callers can override, for readability. RNR is only a place to copy a file from, or borrow token names from, when something complex is actually needed. We don't use its CLI or init.

**Native controls for behavior.** Sliders, pickers, menus, switches, sheets, and toasts use platform-native implementations tinted with the brand accent, not house-styled look-alikes. Where there's no native control that fits, we use plain RN. `radio` is a searchable single-select list, so it becomes a pressable row with a checkmark. `toast` has one consumer, so it becomes a small house component with no new dependency.

**NativeWind 5 with Tailwind v4.** Tokens live CSS-first in `@theme`. NativeWind 5 is still a preview with open dark-mode reports, so adopting it is gated on a spike that proves light/dark switching works. If that fails, we fall back to Uniwind, which uses the same Tailwind v4 classes and `@theme` tokens.

**Remove gluestack entirely**: `@gluestack-ui/core`, `@gluestack-ui/utils`, `@gluestack/ui-next-adapter`, and the provider. Web isn't a target, so the web-only branches in the vendored code go too.

## Consequences

- We maintain every UI file ourselves. There's no upstream to pull fixes from, but there's also no regeneration that wipes our edits.
- We're running a styling engine that's still a preview. The spike and the Uniwind fallback bound that risk.
- Native controls look like the platform, not like Sender. We accept that. The brand lives in type, buttons, badges, inputs, and glass.
- Upgrading the Expo SDK (54 to 57) comes first. SDK 57 is the first version with cross-platform `@expo/ui` controls, which is the likely source for native sliders, menus, and sheets.
