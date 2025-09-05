import { Filter } from "lucide-react-native";
import { Button, ButtonIcon } from "../ui/button";
import { useProblemStore } from "@/stores/problemStore";
import React from "react";

type FilterButtonProps = {
  onFilterPress: () => void;
  className?: string;
  style?: object;
};

export function FilterButton({ onFilterPress, className, style }: FilterButtonProps) {
  const { setViewProblem } = useProblemStore();

  const handleFilterPress = () => {
    // Close the problem actionsheet if it's open
    setViewProblem(false);
    // Open the filter overlay
    onFilterPress();
  };

  return (
    <Button
      onPress={handleFilterPress}
      className={`w-12 h-12 rounded-full shadow-md ${className}`}
      style={style}
      action="secondary"
    >
      <ButtonIcon as={Filter} size="lg" />
    </Button>
  );
}
