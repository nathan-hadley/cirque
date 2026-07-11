import React, { useEffect, useMemo, useState } from "react";
import { CircleIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSearchBar from "@/components/BottomSearchBar";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetHeader,
  ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import { Divider } from "@/components/ui/divider";
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from "@/components/ui/radio";
import { Text } from "@/components/ui/text";
import { leavenworthAreas } from "@/constants/areas";
import { useDataStore } from "@/stores/dataStore";

type AreaPickerSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (area: string) => void;
  currentArea: string;
};

function AreaPickerSheet({ isOpen, onClose, onSelect, currentArea }: AreaPickerSheetProps) {
  const insets = useSafeAreaInsets();
  // Select the stable `data` reference; deriving the array inside the selector
  // returns a new snapshot every read, which loops useSyncExternalStore.
  const data = useDataStore(s => s.data);
  const areas = useMemo(() => leavenworthAreas(data), [data]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredAreas = searchTerm
    ? areas.filter(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
    : areas;

  function handleAreaSelect(area: string) {
    onSelect(area);
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="px-0" style={{ paddingBottom: insets.bottom }}>
        <ActionsheetHeader
          title="Select area"
          onClose={onClose}
          closeButtonTestID="close-area-picker"
          className="px-6"
        />
        <Divider />
        <ActionsheetScrollView
          className="h-[60vh] pt-4 pl-6 pr-7"
          showsVerticalScrollIndicator={false}
        >
          <RadioGroup value={currentArea} className="gap-6 py-2" onChange={handleAreaSelect}>
            {filteredAreas.map(area => (
              <Radio
                key={area}
                testID={`area-option-${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                value={area}
                className="justify-between"
              >
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
        <BottomSearchBar
          placeholder="Search areas..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </ActionsheetContent>
    </Actionsheet>
  );
}

export default AreaPickerSheet;
