import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useColorScheme } from "nativewind";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { GRADES } from "@/models/problems";

type GradePickerProps = {
  isOpen: boolean;
  onClose: (grade: string) => void;
  currentGrade: string | null;
};

const DEFAULT_GRADE = "V3";

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

  const textColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";

  return (
    <Sheet isOpen={isOpen} onClose={handleClose} detents={["auto"]}>
      <SheetHeader
        title="Select grade"
        onClose={handleClose}
        closeButtonTestID="close-grade-picker"
      />
      <View className="pb-6" style={{ height: Platform.OS === "ios" ? 216 : undefined }}>
        <Picker
          selectedValue={selectedGrade}
          onValueChange={value => handleSelect(String(value))}
          itemStyle={{ color: textColor }}
          dropdownIconColor={textColor}
          style={{ color: textColor }}
        >
          {GRADES.map(grade => (
            <Picker.Item key={grade} label={grade} value={grade} color={textColor} />
          ))}
        </Picker>
      </View>
    </Sheet>
  );
}
