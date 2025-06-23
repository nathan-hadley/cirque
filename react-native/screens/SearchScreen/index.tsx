import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { useProblemStore } from '@/stores/problemStore';
import { useMapStore } from '@/stores/mapStore';
import { Problem } from '@/models/problems';
import { SearchResultItem } from './SearchResultItem';
import { Icon } from '@/components/ui/icon';
import { Center } from '@/components/ui/center';

type SearchOverlayProps = {
  isVisible: boolean;
  onClose: () => void;
};

type SearchResult = {
  problem: Problem;
  matchType: 'name' | 'grade' | 'subarea';
};

export function SearchOverlay({ isVisible, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { problemsData, createProblemFromMapFeature, setProblem, setViewProblem } =
    useProblemStore();
  const { flyToProblemCoordinates } = useMapStore();

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim() || !problemsData) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    problemsData.features.forEach(feature => {
      const problem = createProblemFromMapFeature(feature);
      if (!problem) return;

      // Search by name
      if (problem.name?.toLowerCase().includes(query)) {
        results.push({ problem, matchType: 'name' });
        return;
      }

      // Search by grade
      if (problem.grade?.toLowerCase().includes(query)) {
        results.push({ problem, matchType: 'grade' });
        return;
      }

      // Search by subarea
      if (problem.subarea?.toLowerCase().includes(query)) {
        results.push({ problem, matchType: 'subarea' });
        return;
      }
    });

    // Sort results: name matches first, then grade, then subarea
    results.sort((a, b) => {
      const order = { name: 0, grade: 1, subarea: 2 };
      return order[a.matchType] - order[b.matchType];
    });

    setSearchResults(results.slice(0, 50)); // Limit to 50 results
  }, [searchQuery, problemsData, createProblemFromMapFeature]);

  const handleSelectResult = (result: SearchResult) => {
    const { problem } = result;

    // Set the selected problem
    setProblem(problem);
    setViewProblem(true);

    // Fly to the problem location with consistent zoom
    if (problem.coordinates) {
      flyToProblemCoordinates(problem.coordinates, 18); // Fixed zoom level for all problems
    }

    // Close the search overlay
    onClose();
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    Keyboard.dismiss();
  };

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 bg-white z-50">
      <SafeAreaView className="flex-1">
        {/* Search Header */}
        <View className="px-4 py-3 border-b border-gray-200">
          <HStack space="sm" className="items-center">
            <Input className="flex-1 bg-typography-100" variant="rounded" size="lg">
              <InputIcon as={Search} className="ml-3" />
              <InputField
                value={searchQuery}
                onChangeText={setSearchQuery}
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
          {searchQuery.trim() === '' ? (
            <Center className="flex-1 justify-center items-center px-4">
              <HStack space="sm" className="items-center justify-center">
                <Icon as={Search} size="xl" />
                <Text className="text-lg font-bold">
                  Search
                </Text>
              </HStack>
              <Text className="text-typography-600 mt-2">
                Search by problem name, grade, or area
              </Text>
            </Center>
          ) : searchResults.length === 0 ? (
            <Center className="flex-1 justify-center items-center px-4">
              <Text className="text-typography-900 text-lg font-bold">
                No problems found for "{searchQuery}"
              </Text>
              <Text className="text-typography-600 mt-2">
                Try a different search term
              </Text>
            </Center>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <SearchResultItem result={item} onPress={handleSelectResult} />
              )}
              keyExtractor={(item, index) => `${item.problem.id}-${index}`}
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
