import React, { useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetHeader,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Slider, SliderThumb, SliderTrack } from "@/components/ui/slider";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MAX_GRADE, MIN_GRADE } from "@/models/problems";
import { useProblemStore } from "@/stores/problemStore";

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
  }

  function handleClose() {
    onClose(minGradeRef.current, maxGradeRef.current);
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={{ paddingBottom: bottom + 16 }}>
        <VStack className="w-full">
          {/* Header */}
          <ActionsheetHeader title="Adjust grade range" onClose={handleClose} />

          <VStack space="lg" className="pb-6">
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
