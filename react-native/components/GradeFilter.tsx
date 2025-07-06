import { ScrollView, TouchableOpacity } from "react-native";
import { Badge, BadgeText, HStack, VStack, Text } from "@/components/ui";
import { useProblemStore } from "@/stores/problemStore";
import { X } from "lucide-react-native";

const AVAILABLE_GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9"];

export default function GradeFilter() {
  const { selectedGrades, toggleGrade, setSelectedGrades } = useProblemStore();

  const handleClearAll = () => {
    setSelectedGrades([]);
  };

  const hasFilters = selectedGrades.length > 0;

  return (
    <VStack className="p-4 bg-white border-t border-gray-200">
      <HStack className="justify-between items-center mb-3">
        <Text className="font-semibold text-gray-900">Filter by Grade</Text>
        {hasFilters && (
          <TouchableOpacity onPress={handleClearAll} className="flex-row items-center">
            <X size={16} color="#6B7280" />
            <Text className="ml-1 text-sm text-gray-600">Clear</Text>
          </TouchableOpacity>
        )}
      </HStack>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack className="gap-2">
          {AVAILABLE_GRADES.map((grade) => {
            const isSelected = selectedGrades.includes(grade);
            return (
              <TouchableOpacity
                key={grade}
                onPress={() => toggleGrade(grade)}
                activeOpacity={0.7}
              >
                <Badge
                  className={`px-3 py-1 ${
                    isSelected 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-gray-100 border-gray-300'
                  }`}
                  variant={isSelected ? "solid" : "outline"}
                >
                  <BadgeText
                    className={`text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {grade}
                  </BadgeText>
                </Badge>
              </TouchableOpacity>
            );
          })}
        </HStack>
      </ScrollView>
    </VStack>
  );
}