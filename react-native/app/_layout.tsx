import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { SyncInitializer } from "@/services/sync/SyncInitializer";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode="system">
        <KeyboardProvider>
          <StatusBar style="auto" />
          <SyncInitializer />
          <Slot />
        </KeyboardProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
