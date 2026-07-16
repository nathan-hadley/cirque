import { useEffect, useRef } from "react";
import { Platform, Pressable, View } from "react-native";
import { TrueSheet, type TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { X } from "lucide-react-native";
import { isLiquidGlassAvailable } from "@/components/ui/GlassSurface";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

type SheetProps = Omit<
  TrueSheetProps,
  "backgroundBlur" | "backgroundColor" | "onDidDismiss" | "ref"
> & {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Declarative wrapper over TrueSheet's imperative present/dismiss API.
 *
 * `backgroundBlur` and `backgroundColor` are omitted deliberately: TrueSheet
 * enables iOS 26 Liquid Glass only while both are unset, so accepting either
 * prop would let a caller silently disable it.
 */
export function Sheet({ isOpen, onClose, children, ...props }: SheetProps) {
  const sheet = useRef<TrueSheet>(null);
  const presented = useRef(false);

  useEffect(() => {
    if (isOpen === presented.current) return;
    presented.current = isOpen;

    const action = isOpen ? sheet.current?.present() : sheet.current?.dismiss();
    action?.catch((e: unknown) => console.error("Sheet transition failed", e));
  }, [isOpen]);

  // Fires for native dismissals (drag, backdrop, back gesture) as well as our
  // own dismiss() above, so guard against reporting a close twice.
  function handleDidDismiss() {
    if (!presented.current) return;
    presented.current = false;
    onClose();
  }

  const background =
    !isLiquidGlassAvailable() && Platform.OS === "ios"
      ? { backgroundBlur: "system-material" as const }
      : {};

  return (
    <TrueSheet
      ref={sheet}
      grabber
      cornerRadius={24}
      onDidDismiss={handleDidDismiss}
      {...background}
      {...props}
    >
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
