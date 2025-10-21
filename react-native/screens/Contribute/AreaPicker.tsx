import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { CircleIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetHeader,
  ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import { Divider } from "@/components/ui/divider";
import { Input, InputField } from "@/components/ui/input";
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from "@/components/ui/radio";
import { Text } from "@/components/ui/text";

const LEAVENWORTH_AREAS = [
  "Barney's Rubble",
  "Clamshell Cave",
  "Forestland",
  "Mad Meadows",
  "Straightaways",
  "Swiftwater",
] as const;

type AreaPickerSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (area: string) => void;
  currentArea: string;
};

function AreaPickerSheet({ isOpen, onClose, onSelect, currentArea }: AreaPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredAreas = searchTerm
    ? LEAVENWORTH_AREAS.filter(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
    : LEAVENWORTH_AREAS;

  function handleAreaSelect(area: string) {
    onSelect(area);
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="px-0" style={{ paddingBottom: insets.bottom }}>
        <ActionsheetHeader title="Select area" onClose={onClose} className="px-6" />
        <Divider />
        <ActionsheetScrollView
          className="h-[60vh] pt-4 pl-6 pr-7"
          showsVerticalScrollIndicator={false}
        >
          <RadioGroup value={currentArea} className="gap-6 py-2" onChange={handleAreaSelect}>
            {filteredAreas.map(area => (
              <Radio key={area} value={area} className="justify-between">
                <RadioLabel>
                  <Text className="text-typography-900">{area}</Text>
                </RadioLabel>
                <RadioIndicator>
                  <RadioIcon as={CircleIcon} />
                </RadioIndicator>
              </Radio>
            ))}
          </RadioGroup>
        </ActionsheetScrollView>
        <View className="w-full border-t border-outline-200 px-6 py-4">
          <Input size="lg">
            <InputField
              placeholder="Search areas..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="words"
            />
          </Input>
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

export default AreaPickerSheet;
