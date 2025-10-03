import "react-native-url-polyfill/auto";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "../global.css";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system">
      <KeyboardProvider>
        <StatusBar style="auto" />
        <Slot />
      </KeyboardProvider>
    </GluestackUIProvider>
  );
}
