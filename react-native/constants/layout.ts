import { Platform } from "react-native";

/**
 * Height of the native tab bar, excluding the bottom safe-area inset.
 *
 * NativeTabs draws over the content and does not report its height through
 * `useSafeAreaInsets()` (measured: bottom inset is 34 on an iPhone 17 Pro, the
 * home indicator alone), and expo-router exposes no hook for it. Anything
 * anchored to the bottom of a screen must add this on top of `insets.bottom`
 * or it will sit underneath the tab bar.
 */
export const TAB_BAR_HEIGHT = Platform.select({ ios: 49, android: 80, default: 0 });
