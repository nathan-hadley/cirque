import React from "react";
import { ScrollView, TouchableOpacity, Platform } from "react-native";
import { Actionsheet, ActionsheetContent, ActionsheetBackdrop, ActionsheetDragIndicatorWrapper, ActionsheetDragIndicator } from "@/components/ui/actionsheet";
import { Badge, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { useProblemStore } from "@/stores/problemStore";
import { X } from "lucide-react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";

const AVAILABLE_GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9"];

type GradeFilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GradeFilterSheet({ isOpen, onClose }: GradeFilterSheetProps) {
  const { selectedGrades, toggleGrade, setSelectedGrades } = useProblemStore();

  const handleClearAll = () => {
    setSelectedGrades([]);
  };

  const hasFilters = selectedGrades.length > 0;

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose} snapPoints={[40]}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="p-0">
        <VStack className="w-full">
          {/* Header */}
          <ActionsheetDragIndicatorWrapper className="p-6 border-b border-gray-100">
            <HStack className="justify-between items-center w-full">
              <Text className="text-xl font-semibold text-typography-900">Filter by grade</Text>
              <Button onPress={onClose} variant="link" className="p-1">
                <ButtonIcon as={X} className="w-8 h-8" />
              </Button>
            </HStack>

            <HStack className="justify-between items-center w-full">
              <Text className="text-sm text-typography-600">
                {selectedGrades.length} grade{selectedGrades.length !== 1 ? 's' : ''} selected
              </Text>
              <Button onPress={handleClearAll} variant="link">
                <ButtonText className="text-info-600">Clear All</ButtonText>
              </Button>
            </HStack>
          </ActionsheetDragIndicatorWrapper>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-4 px-6">
            <HStack className="gap-3">
              {AVAILABLE_GRADES.map((grade) => {
                const isSelected = selectedGrades.includes(grade);
                return (
                  <TouchableOpacity
                    key={grade}
                    onPress={() => toggleGrade(grade)}
                    activeOpacity={0.7}
                    className="mb-2"
                  >
                    <Badge
                      className={`px-4 py-2 min-w-[52px] ${isSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-100 border-gray-300'
                        }`}
                      variant={isSelected ? "solid" : "outline"}
                    >
                      <BadgeText
                        className={`text-base font-semibold text-center ${isSelected ? 'text-white' : 'text-gray-700'
                          }`}
                      >
                        {grade}
                      </BadgeText>
                    </Badge>
                  </TouchableOpacity>
                );
              })}
            </HStack>
          </ScrollView>

          {/* Help Text */}
          <Text className="text-s text-typography-600 text-center mt-2">
            Problems and circuit lines will be filtered to show only selected grades
          </Text>
        </VStack>

        {/* Bottom padding for safe area */}
        <VStack style={{ height: Platform.OS === "ios" ? 34 : 16 }} />
      </ActionsheetContent>
    </Actionsheet>
  );
}