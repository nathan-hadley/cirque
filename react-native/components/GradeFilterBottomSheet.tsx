import React from "react";
import { ScrollView, TouchableOpacity, Platform } from "react-native";
import { Actionsheet, ActionsheetContent, ActionsheetBackdrop } from "@/components/ui/actionsheet";
import { Badge, BadgeText, HStack, VStack, Text } from "@/components/ui";
import { useProblemStore } from "@/stores/problemStore";
import { X } from "lucide-react-native";

const AVAILABLE_GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9"];

type GradeFilterBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GradeFilterBottomSheet({ isOpen, onClose }: GradeFilterBottomSheetProps) {
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
          <VStack className="px-6 pt-6 pb-4 border-b border-gray-100">
            <HStack className="justify-between items-center mb-3">
              <Text className="text-xl font-semibold text-gray-900">Filter by Grade</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </HStack>
            
            {hasFilters && (
              <HStack className="justify-between items-center">
                <Text className="text-sm text-gray-600">
                  {selectedGrades.length} grade{selectedGrades.length !== 1 ? 's' : ''} selected
                </Text>
                <TouchableOpacity onPress={handleClearAll} className="px-3 py-1">
                  <Text className="text-sm text-blue-500 font-medium">Clear All</Text>
                </TouchableOpacity>
              </HStack>
            )}
          </VStack>

          {/* Grade Selection */}
          <VStack className="px-6 py-6">
            <Text className="text-sm font-medium text-gray-700 mb-4">Select grades to filter:</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
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
                        className={`px-4 py-2 min-w-[52px] ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'bg-gray-100 border-gray-300'
                        }`}
                        variant={isSelected ? "solid" : "outline"}
                      >
                        <BadgeText
                          className={`text-base font-semibold text-center ${
                            isSelected ? 'text-white' : 'text-gray-700'
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
            <Text className="text-xs text-gray-500 text-center mt-2">
              {hasFilters 
                ? "Problems and circuit lines will be filtered to show only selected grades"
                : "Select grades above to filter problems on the map"
              }
            </Text>
          </VStack>

          {/* Bottom padding for safe area */}
          <VStack style={{ height: Platform.OS === "ios" ? 34 : 16 }} />
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}