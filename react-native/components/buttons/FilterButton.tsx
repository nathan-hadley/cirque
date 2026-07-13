import { Pressable } from "react-native";
import { Filter } from "lucide-react-native";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Icon } from "../ui/icon";

type FilterButtonProps = {
  onPress: () => void;
};

export function FilterButton({ onPress }: FilterButtonProps) {
  return (
    <GlassSurface
      variant="control"
      style={{ width: 48, height: 48, borderRadius: 24, overflow: "hidden" }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ borderless: true, radius: 24 }}
        testID="open-grade-filter"
        accessibilityLabel="Adjust grade filter"
        className="flex-1 items-center justify-center"
      >
        <Icon as={Filter} size="xl" />
      </Pressable>
    </GlassSurface>
  );
}
