import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import WheelPicker from "react-native-wheely";
import { Sheet, SheetHeader, type SheetRef } from "@/components/ui/sheet";
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
  const sheet = useRef<SheetRef>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (currentGrade) {
        const index = GRADES.indexOf(currentGrade);
        if (index >= 0) {
          setSelectedIndex(index);
          gradeRef.current = index;
        }
      }
      wasOpen.current = true;
      sheet.current?.present().catch((e: unknown) => console.error("Sheet present failed", e));
    } else if (wasOpen.current) {
      wasOpen.current = false;
      sheet.current?.dismiss().catch((e: unknown) => console.error("Sheet dismiss failed", e));
    }
  }, [isOpen, currentGrade]);

  function handleSelect(index: number) {
    setSelectedIndex(index);
    gradeRef.current = index;
  }

  function handleClose() {
    onClose(GRADES[gradeRef.current]);
  }

  function handleDidDismiss() {
    wasOpen.current = false;
    handleClose();
  }

  return (
    <Sheet
      ref={sheet}
      detents={["auto"]}
      scrollableOptions={{ scrollingExpandsSheet: false }}
      onDidDismiss={handleDidDismiss}
    >
      <SheetHeader
        title="Select grade"
        onClose={handleClose}
        closeButtonTestID="close-grade-picker"
      />
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
    </Sheet>
  );
}
