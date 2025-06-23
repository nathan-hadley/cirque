import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Problem } from '@/models/problems';

type SearchResult = {
  problem: Problem;
  matchType: 'name' | 'grade' | 'subarea';
};

type SearchResultItemProps = {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
};

export function SearchResultItem({ result, onPress }: SearchResultItemProps) {
  const { problem, matchType } = result;

  const getMatchTypeLabel = () => {
    switch (matchType) {
      case 'name':
        return 'Name';
      case 'grade':
        return 'Grade';
      case 'subarea':
        return 'Area';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(result)}
      className="px-4 py-3 border-b border-gray-200"
    >
      <VStack space="xs">
        <HStack space="sm" className="items-center justify-between">
          <Text className="text-lg font-medium text-gray-900 flex-1">
            {problem.name || 'Unnamed Problem'}
          </Text>
          <Text className="text-sm text-gray-500">{problem.grade || '?'}</Text>
        </HStack>
        <HStack space="sm" className="items-center">
          <Text className="text-sm text-gray-600">{problem.subarea || 'Unknown Area'}</Text>
          <Text className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {getMatchTypeLabel()}
          </Text>
        </HStack>
      </VStack>
    </TouchableOpacity>
  );
}
