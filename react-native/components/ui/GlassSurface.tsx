import { type ReactNode } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useColorScheme } from "nativewind";

export { isLiquidGlassAvailable };

type GlassSurfaceProps = {
  variant?: "chrome" | "statusBar" | "control";
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: ReactNode;
};

export function GlassSurface({
  variant = "chrome",
  style,
  className,
  children,
}: GlassSurfaceProps) {
  const { colorScheme } = useColorScheme();

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView style={style} glassEffectStyle="regular" isInteractive={variant === "control"}>
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
    <View
      className={`bg-background-0 ${className ?? ""}`}
      style={[{ elevation: variant === "control" ? 6 : 3 }, style]}
    >
      {children}
    </View>
  );
}
