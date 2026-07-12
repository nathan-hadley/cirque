import React, { useState } from "react";
import { Keyboard, Platform, StatusBar, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { useDataStore } from "@/stores/dataStore";
import { useMapStore } from "@/stores/mapStore";
import { useProblemStore } from "@/stores/problemStore";
import { SearchEmpty } from "./SearchEmpty";
import { searchProblems, SearchResult } from "./searchProblems";
import { SearchResultItem } from "./SearchResultItem";

type SearchOverlayProps = {
  isVisible: boolean;
  onClose: () => void;
};

export function SearchOverlay({ isVisible, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const problemsData = useDataStore(s => s.data.problems);
  const { createProblemFromMapFeature, setProblem, setViewProblem, minGrade, maxGrade } =
    useProblemStore();
  const { flyToProblemCoordinates } = useMapStore();
  const { colorScheme } = useColorScheme();

  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);

    if (!query.trim() || !problemsData) {
      setSearchResults([]);
      return;
    }

    const problems = problemsData.features
      .map(createProblemFromMapFeature)
      .filter(problem => problem !== null);
    setSearchResults(searchProblems(problems, query, { minGrade, maxGrade }));
  };

  const handleSelectResult = (result: SearchResult) => {
    const { problem } = result;

    setProblem(problem);
    setViewProblem(true);

    if (problem.coordinates) {
      flyToProblemCoordinates(problem.coordinates, 18);
    }

    // Close the search overlay
    onClose();
    setSearchQuery("");
    Keyboard.dismiss();
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
    Keyboard.dismiss();
  };

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 bg-typography-0 z-1">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView className="flex-1">
        {/* Search Header */}
        <View className="px-4 py-3 border-b border-gray-200">
          <HStack space="sm" className="items-center">
            <Input className="flex-1 bg-typography-100" variant="rounded" size="lg">
              <InputIcon as={Search} className="ml-3" />
              <InputField
                testID="problem-search-input"
                accessibilityLabel="Problem search"
                value={searchQuery}
                onChangeText={handleSetSearchQuery}
                placeholder="Search problems..."
                autoFocus
                returnKeyType="search"
                className="text-typography-900"
              />
            </Input>
            <TouchableOpacity onPress={handleClose} className="p-2">
              <Icon as={X} size="xl" />
            </TouchableOpacity>
          </HStack>
        </View>

        {/* Search Results */}
        <View className="flex-1">
          {searchQuery.trim() === "" || searchResults.length === 0 ? (
            <SearchEmpty searchQuery={searchQuery} />
          ) : (
            <FlashList
              data={searchResults}
              renderItem={({ item }) => (
                <SearchResultItem result={item} onPress={handleSelectResult} />
              )}
              keyExtractor={(item, index) => `${item.problem.id}-${index}`}
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListFooterComponent={() => (
                <View style={{ height: Platform.OS === "ios" ? 48 : 0 }} />
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
