import { Platform, StyleProp, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BlurBackgroundProps = {
  position?: "statusBar" | "tabBar";
  style?: StyleProp<ViewStyle>;
};

export default function BlurBackground({ position = "tabBar", style }: BlurBackgroundProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const positionStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 1,
    // Add 1px to the height to account for the border
    height: position === "statusBar" ? insets.top + 1 : undefined,
  } as ViewStyle;

  // On iOS, use BlurView for the native blur effect
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={75}
        tint={colorScheme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
        style={[positionStyle, style]}
      />
    );
  }

  // On Android and other platforms, use a solid background
  const androidBorder = position === "statusBar" ? "border-b" : "border-t";
  return (
    <View
      className={`absolute bg-background-0 border-outline-200 ${androidBorder}`}
      style={[positionStyle, style]}
    />
  );
}
