import type { Problem } from "@/models/problems";

export type VariantProps = {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
  onFilter: () => void;
  onLocate: () => void;
  filtered: boolean;
  gradeRange: string;
};

export type ChromeProps = Pick<VariantProps, "onSearch" | "onFilter" | "onLocate" | "filtered" | "gradeRange">;
