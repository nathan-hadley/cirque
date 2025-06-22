import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import '../global.css';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system">
      <Slot />
      <StatusBar style="auto" />
    </GluestackUIProvider>
  );
}
