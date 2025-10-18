import { Filter } from "lucide-react-native";
import { Button, ButtonIcon, IButtonProps } from "../ui/button";

export function FilterButton({ ...props }: IButtonProps) {
  return (
    <Button
      {...props}
      action="secondary"
      className="w-12 h-12 rounded-full shadow-md"
    >
      <ButtonIcon as={Filter} size="lg" />
    </Button>
  );
}
