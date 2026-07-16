import { type ReactNode } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useColorScheme } from "nativewind";

export { isLiquidGlassAvailable };

type GlassSurfaceProps = {
  /** Floating controls react to touch and sit higher than passive backdrops. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function GlassSurface({ interactive = false, style, children }: GlassSurfaceProps) {
  const { colorScheme } = useColorScheme();

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView style={style} glassEffectStyle="regular" isInteractive={interactive}>
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={75}
        tint={colorScheme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
        style={style}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View className="bg-background-0" style={[{ elevation: interactive ? 6 : 0 }, style]}>
      {children}
    </View>
  );
}
