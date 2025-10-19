import React from "react";
import { TouchableOpacity } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Problem } from "@/models/problems";

type SearchResult = {
  problem: Problem;
  matchType: "name" | "grade" | "subarea";
};

type SearchResultItemProps = {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
};

export function SearchResultItem({ result, onPress }: SearchResultItemProps) {
  const { problem, matchType } = result;

  const getMatchTypeLabel = () => {
    switch (matchType) {
      case "name":
        return "Name";
      case "grade":
        return "Grade";
      case "subarea":
        return "Area";
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(result)}
      className="px-4 py-3 border-b border-typography-300"
    >
      <VStack space="xs">
        <HStack space="sm" className="items-center justify-between">
          <Text className="text-lg font-medium text-typography-900 flex-1">
            {problem.name || "Unnamed Problem"}
          </Text>
          <Text className="text-sm text-typography-600">{problem.grade || "?"}</Text>
        </HStack>
        <HStack space="sm" className="items-center">
          <Text className="text-sm text-typography-600">{problem.subarea || "Unknown Area"}</Text>
          <Badge variant="solid" action="info">
            <BadgeText>{getMatchTypeLabel()}</BadgeText>
          </Badge>
        </HStack>
      </VStack>
    </TouchableOpacity>
  );
}
