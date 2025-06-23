import React from "react";
import { TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { useProblemStore } from "@/stores/problemStore";

type MapSearchBarProps = {
  onPress: () => void;
};

export function MapSearchBar({ onPress }: MapSearchBarProps) {
  const insets = useSafeAreaInsets();
  const { setViewProblem } = useProblemStore();

  // Match SearchScreen: SafeAreaView + py-4 (16px)
  const topOffset = insets.top + 12;

  const handlePress = () => {
    // Close the problem actionsheet if it's open
    setViewProblem(false);
    // Open the search overlay
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="absolute left-4 right-4"
      style={{
        top: topOffset,
        elevation: Platform.OS === "android" ? 8 : undefined,
      }}
      activeOpacity={0.7}
    >
      <Input className="bg-typography-100" variant="rounded" size="lg" pointerEvents="none">
        <InputIcon as={Search} className="ml-3" />
        <InputField
          placeholder="Search problems..."
          editable={false}
          className="text-typography-600"
          pointerEvents="none"
        />
      </Input>
    </TouchableOpacity>
  );
}
