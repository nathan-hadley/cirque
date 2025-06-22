import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

// This is a shim for web and Android where the tab bar is generally opaque.
export default function TabBarBackground() {
  const { colorScheme } = useColorScheme();

  // On iOS, use BlurView for the native blur effect
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={95}
        tint={colorScheme === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        }}
      />
    );
  }

  // On Android and other platforms, use a solid background
  return <View className="absolute inset-0 bg-background-0 border-t border-outline-200" />;
}

export function useBottomTabOverflow() {
  return 0;
}
