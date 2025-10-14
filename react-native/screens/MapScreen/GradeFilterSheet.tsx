import React, { useState, useRef } from "react";
import { View } from "react-native";
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetBackdrop,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { useProblemStore } from "@/stores/problemStore";
import { X } from "lucide-react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Slider, SliderThumb, SliderTrack } from "@/components/ui/slider";
import { MAX_GRADE, MIN_GRADE } from "@/constants/map";

const numberToGrade = (num: number): string => `V${num}`;

type GradeFilterSheetProps = {
  isOpen: boolean;
  onClose: (minGrade: number, maxGrade: number) => void;
};

export default function GradeFilterSheet({ isOpen, onClose }: GradeFilterSheetProps) {
  const { minGrade, maxGrade } = useProblemStore();
  const { bottom } = useSafeAreaInsets();
  
  const [localMinGrade, setLocalMinGrade] = useState(minGrade);
  const [localMaxGrade, setLocalMaxGrade] = useState(maxGrade);
  const minGradeRef = useRef(minGrade);
  const maxGradeRef = useRef(maxGrade);

  function handleMinGradeChange(value: number) {
    // Prevent min from exceeding max
    const newMin = Math.min(value, localMaxGrade - 1);
    setLocalMinGrade(newMin);
    minGradeRef.current = newMin;
  }

  function handleMaxGradeChange(value: number) {
    // Prevent max from going below min
    const newMax = Math.max(value, localMinGrade + 1);
    setLocalMaxGrade(newMax);
    maxGradeRef.current = newMax;
  }

  function handleReset() {
    setLocalMinGrade(MIN_GRADE);
    setLocalMaxGrade(MAX_GRADE);
    minGradeRef.current = MIN_GRADE;
    maxGradeRef.current = MAX_GRADE;
  };

  function handleClose() {
    onClose(minGradeRef.current, maxGradeRef.current);
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="p-0" style={{ paddingBottom: bottom + 16 }}>
        <VStack className="w-full">
          {/* Header */}
          <ActionsheetDragIndicatorWrapper className="p-6">
            <HStack className="justify-between items-center w-full">
              <Text size="xl" className="font-semibold text-typography-900">Adjust grade range</Text>
              <Button onPress={handleClose} variant="link" className="p-1">
                <ButtonIcon as={X} className="w-8 h-8" />
              </Button>
            </HStack>
          </ActionsheetDragIndicatorWrapper>

          <VStack space="lg" className="px-6 pb-6">
            <HStack className="justify-between items-center">
              <Text size="lg" className="font-semibold">
                {numberToGrade(localMinGrade)} - {numberToGrade(localMaxGrade)}
              </Text>
              <Button onPress={handleReset} variant="outline" size="sm">
                <ButtonText>Reset</ButtonText>
              </Button>
            </HStack>
            
            <HStack space="2xl" className="items-center">
              <Text size="lg">V0</Text>
              <View className="flex-1 relative h-8">
                {/* Min slider */}
                <View className="absolute inset-0">
                  <Slider 
                    value={localMinGrade}
                    onChange={handleMinGradeChange}
                    minValue={0} 
                    maxValue={10} 
                    size="lg"
                    className="flex-1"
                  >
                    <SliderTrack />
                    <SliderThumb hitSlop={15} />
                  </Slider>
                </View>
                
                {/* Max slider - transparent track */}
                <View className="absolute inset-0">
                  <Slider 
                    value={localMaxGrade}
                    onChange={handleMaxGradeChange}
                    minValue={0} 
                    maxValue={10} 
                    size="lg"
                    className="flex-1"
                  >
                    <SliderTrack className="bg-transparent" />
                    <SliderThumb hitSlop={15} />
                  </Slider>
                </View>
              </View>
              <Text size="lg">V10</Text>
            </HStack>
          </VStack>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}
