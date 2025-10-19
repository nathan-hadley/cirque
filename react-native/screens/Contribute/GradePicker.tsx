import React, { useState, useEffect, useRef } from "react";
import { View } from "react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetHeader,
} from "@/components/ui/actionsheet";
import WheelPicker from "react-native-wheely";
import { GRADES } from "./index";

type GradePickerProps = {
  isOpen: boolean;
  onClose: (grade: string) => void;
  currentGrade: string | null;
};

export default function GradePicker({ isOpen, onClose, currentGrade }: GradePickerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const gradeRef = useRef<number>(0);

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
          />
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}
