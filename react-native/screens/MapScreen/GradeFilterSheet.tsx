import React from "react";
import { ScrollView, Pressable } from "react-native";
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetBackdrop,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Badge, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { useProblemStore } from "@/stores/problemStore";
import { X } from "lucide-react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVAILABLE_GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9"];

type GradeFilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GradeFilterSheet({ isOpen, onClose }: GradeFilterSheetProps) {
  const { selectedGrades, toggleGrade, setSelectedGrades } = useProblemStore();
  const { bottom } = useSafeAreaInsets();

  const handleClearAll = () => {
    setSelectedGrades([]);
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="p-0" style={{ paddingBottom: bottom + 16 }}>
        <VStack className="w-full">
          {/* Header */}
          <ActionsheetDragIndicatorWrapper className="p-6">
            <HStack className="justify-between items-center w-full">
              <Text className="text-xl font-semibold text-typography-900">Filter by grade</Text>
              <Button onPress={onClose} variant="link" className="p-1">
                <ButtonIcon as={X} className="w-8 h-8" />
              </Button>
            </HStack>

            <HStack className="justify-between items-center w-full">
              <Text className="text-sm text-typography-600">
                {selectedGrades.length} grade{selectedGrades.length !== 1 ? "s" : ""} selected
              </Text>
              <Button onPress={handleClearAll} variant="link">
                <ButtonText className="text-info-600">Clear All</ButtonText>
              </Button>
            </HStack>
          </ActionsheetDragIndicatorWrapper>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6">
            <HStack className="gap-3">
              {AVAILABLE_GRADES.map(grade => {
                const isSelected = selectedGrades.includes(grade);
                return (
                  <Pressable key={grade} onPress={() => toggleGrade(grade)}>
                    <Badge
                      className={`px-4 py-2 ${
                        isSelected
                          ? "bg-info-500 border-info-500"
                          : "bg-background-100 border-background-300"
                      }`}
                      variant="solid"
                    >
                      <BadgeText
                        size="lg"
                        className={`font-semibold text-center ${
                          isSelected ? "text-typography-0" : "text-typography-700"
                        }`}
                      >
                        {grade}
                      </BadgeText>
                    </Badge>
                  </Pressable>
                );
              })}
            </HStack>
          </ScrollView>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}
