import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import WheelPicker from "react-native-wheely";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetHeader,
} from "@/components/ui/actionsheet";
import { GRADES } from "@/models/problems";

type GradePickerProps = {
  isOpen: boolean;
  onClose: (grade: string) => void;
  currentGrade: string | null;
};

const DEFAULT_INDEX = 3; // V3

export default function GradePicker({ isOpen, onClose, currentGrade }: GradePickerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { colorScheme } = useColorScheme();
  const gradeRef = useRef<number>(DEFAULT_INDEX);

  useEffect(() => {
    if (isOpen && currentGrade) {
      const index = GRADES.indexOf(currentGrade);
      if (index >= 0) {
        setSelectedIndex(index);
        gradeRef.current = index;
      }
    }
  }, [isOpen, currentGrade]);

  function handleSelect(index: number) {
    setSelectedIndex(index);
    gradeRef.current = index;
  }

  function handleClose() {
    onClose(GRADES[gradeRef.current]);
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetHeader title="Select grade" onClose={handleClose} />
        <View className="pb-6">
          <WheelPicker
            selectedIndex={selectedIndex}
            options={GRADES}
            onChange={handleSelect}
            itemHeight={40}
            itemTextStyle={{ color: colorScheme === "dark" ? "#FFFFFF" : undefined }}
            selectedIndicatorStyle={{
              backgroundColor: colorScheme === "dark" ? "#374151" : undefined,
            }}
          />
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}
