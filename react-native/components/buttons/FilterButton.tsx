import { Filter } from "lucide-react-native";
import { Button, ButtonIcon } from "../ui/button";

type FilterButtonProps = {
  onFilterPress: () => void;
  className?: string;
  style?: object;
};

export function FilterButton({ onFilterPress, className, style }: FilterButtonProps) {
  return (
    <Button
      onPress={onFilterPress}
      className={`w-12 h-12 rounded-full shadow-md ${className}`}
      style={style}
      action="secondary"
    >
      <ButtonIcon as={Filter} size="lg" />
    </Button>
  );
}
