import React from "react";
import { Pressable } from "react-native";
import { CompassIcon } from "lucide-react-native";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Icon } from "../ui/icon";

type LocateMeButtonProps = {
  onPress: () => void;
};

export function LocateMeButton({ onPress }: LocateMeButtonProps) {
  return (
    <GlassSurface
      variant="control"
      style={{ width: 48, height: 48, borderRadius: 24, overflow: "hidden" }}
    >
      <Pressable onPress={onPress} className="flex-1 items-center justify-center">
        <Icon as={CompassIcon} size="xl" />
      </Pressable>
    </GlassSurface>
  );
}
