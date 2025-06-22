import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  FlatList, 
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { useProblemStore } from '@/stores/problemStore';
import { useMapStore } from '@/stores/mapStore';
import { Problem } from '@/models/problems';

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
  const { problemsData, createProblemFromMapFeature, setProblem, setViewProblem } = useProblemStore();
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

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const { problem, matchType } = item;
    
    const getMatchTypeLabel = () => {
      switch (matchType) {
        case 'name': return 'Name';
        case 'grade': return 'Grade';
        case 'subarea': return 'Area';
      }
    };

    return (
      <TouchableOpacity
        onPress={() => handleSelectResult(item)}
        className="px-4 py-3 border-b border-gray-200"
      >
        <VStack space="xs">
          <HStack space="sm" className="items-center justify-between">
            <Text className="text-lg font-medium text-gray-900 flex-1">
              {problem.name || 'Unnamed Problem'}
            </Text>
            <Text className="text-sm text-gray-500">
              {problem.grade || '?'}
            </Text>
          </HStack>
          <HStack space="sm" className="items-center">
            <Text className="text-sm text-gray-600">
              {problem.subarea || 'Unknown Area'}
            </Text>
            <Text className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {getMatchTypeLabel()}
            </Text>
          </HStack>
        </VStack>
      </TouchableOpacity>
    );
  };

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 bg-white z-50">
      <SafeAreaView className="flex-1">
        {/* Search Header */}
        <View className="px-4 py-3 border-b border-gray-200">
          <HStack space="sm" className="items-center">
            <Input className="flex-1 bg-gray-100" variant="rounded" size="lg">
              <InputIcon className="ml-3">
                <Search size={20} color="#6b7280" />
              </InputIcon>
              <InputField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search problems by name, grade, or area..."
                autoFocus
                returnKeyType="search"
                className="text-gray-900"
                style={{ fontSize: 16 }}
              />
            </Input>
            <TouchableOpacity
              onPress={handleClose}
              className="p-2"
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </HStack>
        </View>

        {/* Search Results */}
        <View className="flex-1">
          {searchQuery.trim() === '' ? (
            <View className="flex-1 justify-center items-center px-4">
              <Search size={48} color="#d1d5db" />
              <Text className="text-gray-500 text-center mt-4 text-lg">
                Start typing to search for climbing problems
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Search by problem name, grade, or area
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View className="flex-1 justify-center items-center px-4">
              <Text className="text-gray-500 text-center text-lg">
                No problems found for "{searchQuery}"
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Try a different search term
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item, index) => `${item.problem.id}-${index}`}
              className="flex-1"
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}