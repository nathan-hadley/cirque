import React from "react";
import { Platform, Pressable, View } from "react-native";
import { Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    <View
      className="absolute left-4 right-4"
      style={{
        top: topOffset,
        elevation: Platform.OS === "android" ? 8 : undefined,
      }}
    >
      <Pressable onPress={handlePress} className="flex-1">
        <Input className="bg-typography-100" variant="rounded" size="lg" pointerEvents="none">
          <InputIcon as={Search} className="ml-3" />
          <InputField
            placeholder="Search problems..."
            editable={false}
            className="text-typography-600"
            pointerEvents="none"
          />
        </Input>
      </Pressable>
    </View>
  );
}
