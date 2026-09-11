import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import WheelPicker from "@quidone/react-native-wheel-picker";
import { useColorScheme } from "nativewind";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { GRADES } from "@/models/problems";

type GradePickerProps = {
  isOpen: boolean;
  onClose: (grade: string) => void;
  currentGrade: string | null;
};

const DEFAULT_GRADE = "V3";
const GRADE_ITEMS = GRADES.map(grade => ({ value: grade, label: grade }));

export default function GradePicker({ isOpen, onClose, currentGrade }: GradePickerProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>(DEFAULT_GRADE);
  const { colorScheme } = useColorScheme();
  const gradeRef = useRef<string>(DEFAULT_GRADE);

  useEffect(() => {
    if (!isOpen || !currentGrade) return;
    if (GRADES.includes(currentGrade)) {
      setSelectedGrade(currentGrade);
      gradeRef.current = currentGrade;
    }
  }, [isOpen, currentGrade]);

  function handleSelect(grade: string) {
    setSelectedGrade(grade);
    gradeRef.current = grade;
  }

  function handleClose() {
    onClose(gradeRef.current);
  }

  const isDark = colorScheme === "dark";

  return (
    <Sheet isOpen={isOpen} onClose={handleClose} detents={["auto"]}>
      <SheetHeader
        title="Select grade"
        onClose={handleClose}
        closeButtonTestID="close-grade-picker"
      />
      <View className="pb-6">
        <WheelPicker
          data={GRADE_ITEMS}
          value={selectedGrade}
          onValueChanged={({ item }) => handleSelect(item.value)}
          itemHeight={36}
          visibleItemCount={7}
          enableScrollByTapOnItem
          itemTextStyle={{ color: isDark ? "#FFFFFF" : "#000000" }}
          overlayItemStyle={isDark ? { backgroundColor: "#374151" } : undefined}
        />
      </View>
    </Sheet>
  );
}
