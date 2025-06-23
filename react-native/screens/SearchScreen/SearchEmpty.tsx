import React from "react";
import { Search, View } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Center } from "@/components/ui/center";

type SearchEmptyProps = {
  searchQuery: string;
};

export function SearchEmpty({ searchQuery }: SearchEmptyProps) {
  const hasQuery = searchQuery.trim() !== "";

  return (
    <Center className="flex-1 items-center -mt-48">
      {hasQuery ? (
        // No results state
        <>
          <Text className="text-typography-900 text-lg font-bold">
            No problems found for "{searchQuery}"
          </Text>
          <Text className="text-typography-600 mt-2">Try a different search term</Text>
        </>
      ) : (
        // Empty query state
        <>
          <HStack space="sm" className="items-center justify-center">
            <Icon as={Search} size="xl" />
            <Text className="text-lg font-bold">Search</Text>
          </HStack>
          <Text className="text-typography-600 mt-2">Search by problem name, grade, or area</Text>
        </>
      )}
    </Center>
  );
}
