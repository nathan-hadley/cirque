import { useState } from "react";
import RangeSlider from "@/components/RangeSlider";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MAX_GRADE, MIN_GRADE } from "@/models/problems";
import { useProblemStore } from "@/stores/problemStore";

const numberToGrade = (num: number): string => `V${num}`;

function formatRange(min: number, max: number): string {
  return min === max ? numberToGrade(min) : `${numberToGrade(min)} - ${numberToGrade(max)}`;
}

type GradeFilterSheetProps = {
  isOpen: boolean;
  onClose: (minGrade: number, maxGrade: number) => void;
};

export default function GradeFilterSheet({ isOpen, onClose }: GradeFilterSheetProps) {
  const { minGrade, maxGrade } = useProblemStore();
  const [localMinGrade, setLocalMinGrade] = useState(minGrade);
  const [localMaxGrade, setLocalMaxGrade] = useState(maxGrade);

  function handleRangeChange(low: number, high: number) {
    setLocalMinGrade(low);
    setLocalMaxGrade(high);
  }

  function handleReset() {
    setLocalMinGrade(MIN_GRADE);
    setLocalMaxGrade(MAX_GRADE);
  }

  function handleClose() {
    onClose(localMinGrade, localMaxGrade);
  }

  return (
    <Sheet isOpen={isOpen} onClose={handleClose} detents={["auto"]}>
      <VStack className="w-full pb-4">
        <SheetHeader
          title="Adjust grade range"
          onClose={handleClose}
          closeButtonTestID="close-grade-filter"
        />

        <VStack space="lg" className="px-6 pb-6">
          <HStack className="justify-between items-center">
            <Text size="lg" className="font-semibold">
              {formatRange(localMinGrade, localMaxGrade)}
            </Text>
            <Button onPress={handleReset} variant="outline" size="sm">
              <ButtonText>Reset</ButtonText>
            </Button>
          </HStack>

          <HStack space="2xl" className="items-center">
            <Text size="lg">V{MIN_GRADE}</Text>
            <RangeSlider
              min={MIN_GRADE}
              max={MAX_GRADE}
              low={localMinGrade}
              high={localMaxGrade}
              onChange={handleRangeChange}
              testID="grade-range-slider"
            />
            <Text size="lg">V{MAX_GRADE}</Text>
          </HStack>
        </VStack>
      </VStack>
    </Sheet>
  );
}
