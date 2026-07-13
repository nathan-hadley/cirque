import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { CircleIcon } from "lucide-react-native";
import BottomSearchBar from "@/components/BottomSearchBar";
import { Divider } from "@/components/ui/divider";
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from "@/components/ui/radio";
import { Sheet, SheetHeader, type SheetRef } from "@/components/ui/sheet";
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
  // Select the stable `data` reference; deriving the array inside the selector
  // returns a new snapshot every read, which loops useSyncExternalStore.
  const data = useDataStore(s => s.data);
  const areas = useMemo(() => leavenworthAreas(data), [data]);
  const [searchTerm, setSearchTerm] = useState("");
  const sheet = useRef<SheetRef>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      wasOpen.current = true;
      sheet.current?.present().catch((e: unknown) => console.error("Sheet present failed", e));
    } else if (wasOpen.current) {
      wasOpen.current = false;
      sheet.current?.dismiss().catch((e: unknown) => console.error("Sheet dismiss failed", e));
    }
  }, [isOpen]);

  const filteredAreas = searchTerm
    ? areas.filter(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
    : areas;

  function handleAreaSelect(area: string) {
    onSelect(area);
  }

  function handleDidDismiss() {
    wasOpen.current = false;
    onClose();
  }

  return (
    <Sheet
      ref={sheet}
      detents={[0.6, 1]}
      scrollable
      onDidDismiss={handleDidDismiss}
      footer={
        <BottomSearchBar
          placeholder="Search areas..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      }
    >
      <SheetHeader title="Select area" onClose={onClose} closeButtonTestID="close-area-picker" />
      <Divider />
      <ScrollView className="pt-4 pl-6 pr-7" showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </Sheet>
  );
}

export default AreaPickerSheet;
