import React from "react";
import { Pressable, View } from "react-native";
import { Search, X } from "lucide-react-native";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";

type BottomSearchBarProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
};

export default function BottomSearchBar({
  placeholder,
  value,
  onChangeText,
}: BottomSearchBarProps) {
  const handleClear = () => {
    onChangeText("");
  };

  return (
    <View className="w-full border-t border-outline-200 px-6 py-4">
      <Input size="lg">
        <InputSlot className="pl-3">
          <InputIcon as={Search} className="text-typography-500" />
        </InputSlot>
        <InputField placeholder={placeholder} value={value} onChangeText={onChangeText} />
        {value.length > 0 && (
          <InputSlot className="pr-3">
            <Pressable onPress={handleClear}>
              <InputIcon as={X} className="text-typography-900" hitSlop={10} />
            </Pressable>
          </InputSlot>
        )}
      </Input>
    </View>
  );
}
