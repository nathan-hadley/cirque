// PROTOTYPE (#74) variant D "Plate": A's chrome and layout, B's progress bar, the map's circuit marker beside the name.
import { Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet } from "@/components/ui/sheet";
import { CircuitMarker, GradeTag, isOnCircuit, PendingTag, SegmentBar, Subarea, TopoFrame } from "./parts";
import { heading, useCircuitNav, useSender } from "./sender";
import type { VariantProps } from "./types";
import { FaithfulChrome, RoundGlassButton } from "./VariantFaithful";

export function VariantPlate({ problem, isOpen, onClose, ...chrome }: VariantProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  const nav = useCircuitNav();
  const circuit = problem ? isOnCircuit(problem) : false;

  return (
    <>
      <FaithfulChrome {...chrome} />

      <Sheet isOpen={isOpen} onClose={onClose} detents={[0.5, 1]} dimmed={false}>
        {problem && (
          <>
            <TopoFrame problem={problem} t={t}>
              <View className="absolute inset-0 flex-row items-center justify-between px-2" pointerEvents="box-none">
                {nav.canPrev ? (
                  <RoundGlassButton onPress={nav.prev}>
                    <ChevronLeft size={26} color={t.ink} strokeWidth={2.75} />
                  </RoundGlassButton>
                ) : (
                  <View />
                )}
                {nav.canNext && (
                  <RoundGlassButton onPress={nav.next}>
                    <ChevronRight size={26} color={t.ink} strokeWidth={2.75} />
                  </RoundGlassButton>
                )}
              </View>
            </TopoFrame>

            <View className="px-5 pt-4" style={{ gap: 10, paddingBottom: insets.bottom + 16 }}>
              <View className="flex-row items-center" style={{ gap: 10 }}>
                {circuit && <CircuitMarker problem={problem} t={t} />}
                <Text numberOfLines={2} style={[heading, { flex: 1, color: t.ink, fontSize: 26, lineHeight: 28 }]}>
                  {problem.name || "Unnamed problem"}
                </Text>
              </View>

              <View className="flex-row flex-wrap items-center" style={{ gap: 12 }}>
                <GradeTag grade={problem.grade} t={t} />
                <Subarea name={problem.subarea} t={t} />
                <PendingTag problem={problem} t={t} />
              </View>

              {circuit && nav.total > 1 && (
                <View className="flex-row items-center" style={{ gap: 10, marginTop: 4 }}>
                  <View className="flex-1">
                    <SegmentBar index={nav.index} total={nav.total} t={t} />
                  </View>
                  <Text style={{ color: t.muted, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] }}>
                    {nav.index + 1} of {nav.total}
                  </Text>
                </View>
              )}

              {problem.description && (
                <Text style={{ color: t.ink, fontSize: 16, lineHeight: 23, marginTop: 2 }}>{problem.description}</Text>
              )}
            </View>
          </>
        )}
      </Sheet>
    </>
  );
}
