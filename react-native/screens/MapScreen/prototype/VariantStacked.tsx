// PROTOTYPE (#74) variant E "Stacked": B's chrome and header-first order, grade at text size, the progress bar doubles as prev/next.
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet } from "@/components/ui/sheet";
import { circuitLabel, isOnCircuit, NavSquare, PendingTag, SegmentBar, Subarea, TopoFrame } from "./parts";
import { heading, useCircuitNav, useSender } from "./sender";
import type { VariantProps } from "./types";
import { PosterChrome } from "./VariantPoster";

export function VariantStacked({ problem, isOpen, onClose, ...chrome }: VariantProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  const nav = useCircuitNav();
  const circuit = problem ? isOnCircuit(problem) : false;

  return (
    <>
      <PosterChrome {...chrome} />

      <Sheet isOpen={isOpen} onClose={onClose} detents={[0.5, 1]} dimmed={false}>
        {problem && (
          <View style={{ paddingBottom: insets.bottom + 16 }}>
            <View className="px-5 pt-6" style={{ gap: 8 }}>
              <Text numberOfLines={2} style={[heading, { color: t.ink, fontSize: 26, lineHeight: 28 }]}>
                {problem.name || "Unnamed problem"}
              </Text>
              <View className="flex-row flex-wrap items-center" style={{ columnGap: 14, rowGap: 6 }}>
                {problem.grade && (
                  <Text style={{ color: t.accent, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 }}>
                    {problem.grade}
                  </Text>
                )}
                {circuit && (
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: problem.color,
                        borderWidth: 1,
                        borderColor: t.line,
                      }}
                    />
                    <Text style={{ color: t.muted, fontSize: 15, fontWeight: "600" }}>
                      {circuitLabel(problem.colorStr)}
                    </Text>
                  </View>
                )}
                <Subarea name={problem.subarea} t={t} />
                <PendingTag problem={problem} t={t} />
              </View>
            </View>

            {circuit && nav.total > 1 && (
              <View className="flex-row items-center px-5 pt-4" style={{ gap: 12 }}>
                <NavSquare dir="prev" enabled={nav.canPrev} onPress={nav.prev} t={t} />
                <View className="flex-1" style={{ gap: 6 }}>
                  <SegmentBar index={nav.index} total={nav.total} t={t} />
                  <Text
                    style={{
                      color: t.muted,
                      fontSize: 12,
                      fontWeight: "600",
                      textAlign: "center",
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {nav.index + 1} of {nav.total}
                  </Text>
                </View>
                <NavSquare dir="next" enabled={nav.canNext} onPress={nav.next} t={t} />
              </View>
            )}

            <View className="mx-5 mt-4">
              <TopoFrame problem={problem} t={t} radius={8} />
            </View>

            {problem.description && (
              <Text className="px-5 pt-4" style={{ color: t.ink, fontSize: 16, lineHeight: 23 }}>
                {problem.description}
              </Text>
            )}
          </View>
        )}
      </Sheet>
    </>
  );
}
