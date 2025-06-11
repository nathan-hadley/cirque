import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import '../global.css';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { MapProvider } from '@/contexts/MapContext';

export default function RootLayout() {
  return (
    <MapProvider>
      <GluestackUIProvider mode="system">
        <Slot />
        <StatusBar style="auto" />
      </GluestackUIProvider>
    </MapProvider>
  );
}
