import React from "react";
import { TouchableOpacity, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Filter } from "lucide-react-native";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { useProblemStore } from "@/stores/problemStore";

type MapSearchBarProps = {
  onPress: () => void;
  onFilterPress: () => void;
};

export function MapSearchBar({ onPress, onFilterPress }: MapSearchBarProps) {
  const insets = useSafeAreaInsets();
  const { setViewProblem, selectedGrades } = useProblemStore();

  // Match SearchScreen: SafeAreaView + py-4 (16px)
  const topOffset = insets.top + 12;

  const handlePress = () => {
    // Close the problem actionsheet if it's open
    setViewProblem(false);
    // Open the search overlay
    onPress();
  };

  const handleFilterPress = () => {
    // Close the problem actionsheet if it's open
    setViewProblem(false);
    // Open the filter overlay
    onFilterPress();
  };

  const hasActiveFilters = selectedGrades.length > 0;

  return (
    <View
      className="absolute left-4 right-4"
      style={{
        top: topOffset,
        elevation: Platform.OS === "android" ? 8 : undefined,
      }}
    >
      <HStack className="gap-3">
        {/* Search Bar */}
        <TouchableOpacity
          onPress={handlePress}
          className="flex-1"
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

        {/* Filter Button */}
        <TouchableOpacity
          onPress={handleFilterPress}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            hasActiveFilters 
              ? 'bg-blue-500 shadow-lg' 
              : 'bg-white shadow-md'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
          activeOpacity={0.7}
        >
          <Filter 
            size={20} 
            color={hasActiveFilters ? '#ffffff' : '#6B7280'} 
          />
          {hasActiveFilters && (
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          )}
        </TouchableOpacity>
      </HStack>
    </View>
  );
}
