import React, { useState } from "react";
import { Keyboard, Platform, StatusBar, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { problemsData } from "@/assets/problems";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField, InputIcon } from "@/components/ui/input";
import { Problem } from "@/models/problems";
import { useMapStore } from "@/stores/mapStore";
import { useProblemStore } from "@/stores/problemStore";
import { SearchEmpty } from "./SearchEmpty";
import { SearchResultItem } from "./SearchResultItem";

type SearchOverlayProps = {
  isVisible: boolean;
  onClose: () => void;
};

type SearchResult = {
  problem: Problem;
  matchType: "name" | "grade" | "subarea";
};

export function SearchOverlay({ isVisible, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    problemsData.features.forEach(feature => {
      const problem = createProblemFromMapFeature(feature);
      if (!problem) return;

      // Apply grade filter if grades are filtered (not at full range)
      if (minGrade > 0 || maxGrade < 10) {
        if (!problem.grade) return;

        const problemGradeNum = parseInt(problem.grade.replace("V", ""), 10);
        if (problemGradeNum < minGrade || problemGradeNum > maxGrade) {
          return;
        }
      }

      if (problem.name?.toLowerCase().includes(searchTerm)) {
        results.push({ problem, matchType: "name" });
        return;
      }

      if (problem.grade?.toLowerCase().includes(searchTerm)) {
        results.push({ problem, matchType: "grade" });
        return;
      }

      if (problem.subarea?.toLowerCase().includes(searchTerm)) {
        results.push({ problem, matchType: "subarea" });
        return;
      }
    });

    // Sort results: name matches first, then grade, then subarea
    results.sort((a, b) => {
      const order = { name: 0, grade: 1, subarea: 2 };
      return order[a.matchType] - order[b.matchType];
    });

    setSearchResults(results.slice(0, 50)); // Limit to 50 results
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
