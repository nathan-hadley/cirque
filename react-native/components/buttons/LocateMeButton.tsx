import React from "react";
import { CompassIcon } from "lucide-react-native";
import { Button, ButtonIcon } from "../ui/button";

type LocateMeButtonProps = {
  onPress: () => void;
  className?: string;
  style?: object;
};

export function LocateMeButton({ onPress, className, style }: LocateMeButtonProps) {
  return (
    <Button
      onPress={onPress}
      className={`w-12 h-12 rounded-full shadow-md ${className}`}
      style={style}
      action="secondary"
    >
      <ButtonIcon as={CompassIcon} size="lg" />
    </Button>
  );
}
