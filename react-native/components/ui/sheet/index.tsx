import type { Ref } from "react";
import { Platform, Pressable, View } from "react-native";
import { TrueSheet, type TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { X } from "lucide-react-native";
import { isLiquidGlassAvailable } from "@/components/ui/GlassSurface";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export type SheetRef = TrueSheet;

type SheetProps = Omit<TrueSheetProps, "backgroundBlur" | "backgroundColor"> & {
  ref?: Ref<TrueSheet>;
};

export function Sheet({ children, ...props }: SheetProps) {
  const background =
    !isLiquidGlassAvailable() && Platform.OS === "ios"
      ? { backgroundBlur: "system-material" as const }
      : {};

  return (
    <TrueSheet grabber cornerRadius={24} {...background} {...props}>
      {children}
    </TrueSheet>
  );
}

type SheetHeaderProps = {
  title: string;
  onClose: () => void;
  closeButtonTestID?: string;
};

export function SheetHeader({ title, onClose, closeButtonTestID }: SheetHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
      <Text className="text-xl font-semibold text-typography-900">{title}</Text>
      <Pressable
        testID={closeButtonTestID}
        accessibilityLabel={`Close ${title}`}
        onPress={onClose}
        hitSlop={12}
        android_ripple={{ borderless: true, radius: 20 }}
      >
        <Icon as={X} size="xl" />
      </Pressable>
    </View>
  );
}
