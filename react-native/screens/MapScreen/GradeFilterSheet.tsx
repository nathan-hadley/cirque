import React, { useState, useRef } from "react";
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
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/components/ui/slider";

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
    setLocalMinGrade(value);
    minGradeRef.current = value;
  }

  function handleMaxGradeChange(value: number) {
    setLocalMaxGrade(value);
    maxGradeRef.current = value;
  }

  function handleReset() {
    setLocalMinGrade(minGrade);
    setLocalMaxGrade(maxGrade);
    minGradeRef.current = minGrade;
    maxGradeRef.current = maxGrade;
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
              <Text className="text-xl font-semibold text-typography-900">Filter by grade</Text>
              <Button onPress={handleClose} variant="link" className="p-1">
                <ButtonIcon as={X} className="w-8 h-8" />
              </Button>
            </HStack>
          </ActionsheetDragIndicatorWrapper>

          <VStack space="xl" className="px-6 pb-6">
            <HStack className="justify-between items-center">
              <Text>Maximum: {numberToGrade(localMaxGrade)}</Text>
              <Button onPress={handleReset} variant="outline" size="sm">
                <ButtonText>Reset</ButtonText>
              </Button>
            </HStack>
            <HStack space="2xl" className="items-center">
              <Text>V0</Text>
              <Slider 
                value={localMaxGrade}
                defaultValue={maxGrade}
                onChange={handleMaxGradeChange}
                minValue={0} 
                maxValue={10} 
                size="lg"
                className="flex-1"
              >
                <SliderTrack className="h-2">
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb hitSlop={10} />
              </Slider>
              <Text>V10</Text>
            </HStack>
            
            <Text>Minimum: {numberToGrade(localMinGrade)}</Text>
            <HStack space="2xl" className="items-center">
              <Text>V0</Text>
              <Slider 
                value={localMinGrade}
                onChange={handleMinGradeChange}
                defaultValue={minGrade}
                minValue={0} 
                maxValue={10} 
                size="lg"
                className="flex-1"
              >
                <SliderTrack className="h-2">
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb hitSlop={10} />
              </Slider>
              <Text>V10</Text>
            </HStack>
          </VStack>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
}
