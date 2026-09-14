// PROTOTYPE (#74): three takes on C's search + grade filter. Pick with `c=1|2|3`.
import { Pressable, Text, View } from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { ChevronDown, LocateFixed, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { MAX_GRADE, MIN_GRADE } from "@/models/problems";
import { useProblemStore } from "@/stores/problemStore";
import { heading, RADIUS, useSender } from "./sender";
import type { ChromeProps } from "./types";

export const CHROMES = [
  { key: "1", name: "Split" },
  { key: "2", name: "Buttons" },
  { key: "3", name: "Chip" },
] as const;

function clearGrades() {
  const { setMinGrade, setMaxGrade } = useProblemStore.getState();
  setMinGrade(MIN_GRADE);
  setMaxGrade(MAX_GRADE);
}

function LocateButton({ onPress }: { onPress: () => void }) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  return (
    <View className="absolute right-4" style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}>
      <GlassSurface interactive style={{ width: 50, height: 50, borderRadius: 25, overflow: "hidden" }}>
        <Pressable onPress={onPress} accessibilityLabel="Center on my location" className="flex-1 items-center justify-center">
          <LocateFixed size={22} color={t.ink} strokeWidth={2.75} />
        </Pressable>
      </GlassSurface>
    </View>
  );
}

function SplitBar({ onSearch, onFilter, filtered, gradeRange }: ChromeProps) {
  const t = useSender();
  return (
    <GlassSurface interactive style={{ borderRadius: 8, overflow: "hidden" }}>
      <View className="flex-row items-center" style={{ height: 52 }}>
        <Pressable onPress={onSearch} className="flex-1 h-full flex-row items-center" style={{ gap: 10, paddingLeft: 16 }}>
          <Search size={20} color={t.ink} strokeWidth={2.75} />
          <Text style={{ color: t.muted, fontSize: 16, fontWeight: "600" }}>Search problems</Text>
        </Pressable>
        <View style={{ width: 1, height: 28, backgroundColor: t.line }} />
        <View className="h-full flex-row items-center" style={{ backgroundColor: filtered ? t.accent : "transparent" }}>
          <Pressable
            onPress={onFilter}
            className="h-full flex-row items-center"
            style={{ gap: 7, paddingLeft: 14, paddingRight: filtered ? 6 : 14 }}
          >
            <SlidersHorizontal size={18} color={filtered ? t.onAccent : t.ink} strokeWidth={2.75} />
            <Text style={{ color: filtered ? t.onAccent : t.ink, fontSize: 15, fontWeight: "800" }}>{gradeRange}</Text>
          </Pressable>
          {filtered && (
            <Pressable
              onPress={clearGrades}
              accessibilityLabel="Show all grades"
              className="h-full items-center justify-center"
              style={{ paddingLeft: 4, paddingRight: 14 }}
            >
              <X size={18} color={t.onAccent} strokeWidth={3} />
            </Pressable>
          )}
        </View>
      </View>
    </GlassSurface>
  );
}

function ButtonRow({ onSearch, onFilter, filtered, gradeRange }: ChromeProps) {
  const t = useSender();
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      <GlassSurface interactive style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden" }}>
        <Pressable onPress={onSearch} accessibilityLabel="Search problems" className="flex-1 items-center justify-center">
          <Search size={22} color={t.ink} strokeWidth={2.75} />
        </Pressable>
      </GlassSurface>
      {filtered ? (
        <View className="flex-row items-center" style={{ height: 52, borderRadius: 8, backgroundColor: t.accent }}>
          <Pressable onPress={onFilter} className="h-full flex-row items-center" style={{ gap: 8, paddingLeft: 16, paddingRight: 8 }}>
            <Text style={[heading, { color: t.onAccent, fontSize: 18 }]}>{gradeRange}</Text>
          </Pressable>
          <Pressable
            onPress={clearGrades}
            accessibilityLabel="Show all grades"
            className="h-full items-center justify-center"
            style={{ paddingLeft: 4, paddingRight: 14 }}
          >
            <X size={18} color={t.onAccent} strokeWidth={3} />
          </Pressable>
        </View>
      ) : (
        <GlassSurface interactive style={{ height: 52, borderRadius: 8, overflow: "hidden" }}>
          <Pressable onPress={onFilter} className="flex-1 flex-row items-center" style={{ gap: 8, paddingHorizontal: 16 }}>
            <SlidersHorizontal size={18} color={t.ink} strokeWidth={2.75} />
            <Text style={[heading, { color: t.ink, fontSize: 18 }]}>{gradeRange}</Text>
          </Pressable>
        </GlassSurface>
      )}
    </View>
  );
}

function SearchWithChip({ onSearch, onFilter, filtered, gradeRange }: ChromeProps) {
  const t = useSender();
  return (
    <View style={{ gap: 8 }}>
      <GlassSurface interactive style={{ borderRadius: 8, overflow: "hidden" }}>
        <Pressable onPress={onSearch} className="flex-row items-center" style={{ height: 52 }}>
          <View className="h-full justify-center px-4" style={{ borderRightWidth: 1, borderRightColor: t.line }}>
            <Text style={[heading, { color: t.accent, fontSize: 17, letterSpacing: -0.4 }]}>Cirque</Text>
          </View>
          <Text style={{ flex: 1, color: t.muted, fontSize: 16, fontWeight: "600", paddingHorizontal: 12 }}>
            Find a problem
          </Text>
          <View className="pr-4">
            <Search size={20} color={t.ink} strokeWidth={2.75} />
          </View>
        </Pressable>
      </GlassSurface>
      <View className="flex-row">
        {filtered ? (
          <View className="flex-row items-center" style={{ height: 36, borderRadius: RADIUS, backgroundColor: t.accent }}>
            <Pressable onPress={onFilter} className="h-full justify-center" style={{ paddingLeft: 12, paddingRight: 6 }}>
              <Text style={{ color: t.onAccent, fontSize: 15, fontWeight: "800" }}>{gradeRange}</Text>
            </Pressable>
            <Pressable
              onPress={clearGrades}
              accessibilityLabel="Show all grades"
              className="h-full items-center justify-center"
              style={{ paddingLeft: 4, paddingRight: 10 }}
            >
              <X size={16} color={t.onAccent} strokeWidth={3} />
            </Pressable>
          </View>
        ) : (
          <GlassSurface interactive style={{ height: 36, borderRadius: RADIUS, overflow: "hidden" }}>
            <Pressable onPress={onFilter} className="flex-1 flex-row items-center" style={{ gap: 4, paddingLeft: 12, paddingRight: 8 }}>
              <Text style={{ color: t.ink, fontSize: 15, fontWeight: "700" }}>{gradeRange}</Text>
              <ChevronDown size={16} color={t.ink} strokeWidth={2.75} />
            </Pressable>
          </GlassSurface>
        )}
      </View>
    </View>
  );
}

export function SignalChrome(props: ChromeProps) {
  const insets = useSafeAreaInsets();
  const { c } = useGlobalSearchParams<{ c?: string }>();
  const Top = c === "2" ? ButtonRow : c === "3" ? SearchWithChip : SplitBar;

  return (
    <>
      <View className="absolute left-4 right-4" style={{ top: insets.top + 8 }}>
        <Top {...props} />
      </View>
      <LocateButton onPress={props.onLocate} />
    </>
  );
}
