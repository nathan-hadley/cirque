import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

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
