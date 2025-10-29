import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { Feature, GeoJsonProperties, Point } from "geojson";
import { AlertCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTopoImage } from "@/assets/topo-image";
import BottomSearchBar from "@/components/BottomSearchBar";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSearchProblems } from "@/hooks/useProblems";

type ProblemFeature = Feature<Point, GeoJsonProperties>;

/**
 * Check if a problem has a topo image
 */
function hasTopo(feature: ProblemFeature): boolean {
  const topo = feature.properties?.topo;
  return !!(topo && typeof topo === "string" && topo.length > 0);
}

/**
 * Get URI from topo image for use with Image component
 */
export async function getTopoUri(topoKey: string): Promise<string | null> {
  const imageSource = getTopoImage(topoKey);
  if (!imageSource || typeof imageSource === "number") {
    return Image.resolveAssetSource(imageSource as number).uri;
  }
  return null;
}

type ProblemPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (topoKey: string | null, problemName: string) => void;
  currentTopo?: string;
};

export default function ProblemPicker({
  isOpen,
  onClose,
  onSelect,
  currentTopo,
}: ProblemPickerProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProblems = useSearchProblems(searchQuery);

  const handleSelect = (feature: ProblemFeature) => {
    const topoKey = feature.properties?.topo as string | undefined;
    const problemName = feature.properties?.name as string;

    onSelect(topoKey || null, problemName);
    onClose();
    setSearchQuery("");
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose} snapPoints={[80]}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={{ paddingBottom: insets.bottom }}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <VStack className="w-full px-4 pt-4 pb-2" space="md">
          <Heading size="lg" className="text-typography-900">
            Use Existing Topo
          </Heading>
          <Text className="text-typography-600 -mt-2">
            Search for an existing problem to use its topo image
          </Text>
        </VStack>

        <View className="flex-1 px-4 w-full">
          <FlashList
            data={filteredProblems}
            renderItem={({ item }) => (
              <ProblemItem
                problem={item}
                isSelected={item.properties?.topo === currentTopo}
                onSelect={handleSelect}
              />
            )}
            ItemSeparatorComponent={() => <View className="h-2" />}
            ListEmptyComponent={
              <View className="py-8">
                <Text className="text-center text-typography-500">
                  No problems found matching "{searchQuery}"
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        </View>

        <BottomSearchBar
          placeholder="Search problems..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </ActionsheetContent>
    </Actionsheet>
  );
}

type ProblemItemProps = {
  problem: ProblemFeature;
  isSelected: boolean;
  onSelect: (feature: ProblemFeature) => void;
};

function ProblemItem({ problem, isSelected, onSelect }: ProblemItemProps) {
  const handlePress = () => {
    onSelect(problem);
  };

  const hasTopoImage = hasTopo(problem);

  return (
    <Pressable
      onPress={handlePress}
      className={`px-4 py-3 rounded-lg border ${
        isSelected ? "bg-success-50 border-success-600" : "bg-background-0 border-outline-200"
      }`}
    >
      <HStack className="items-center justify-between">
        <VStack className="flex-1">
          <Text className={`font-semibold text-typography-900`}>{problem.properties?.name}</Text>
          <Text className="text-sm text-typography-600">
            {problem.properties?.grade} • {problem.properties?.subarea}
          </Text>
        </VStack>
        {!hasTopoImage && <Icon as={AlertCircle} size="sm" className="text-warning-500 ml-2" />}
      </HStack>
    </Pressable>
  );
}
