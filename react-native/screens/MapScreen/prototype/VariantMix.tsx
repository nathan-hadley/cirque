// PROTOTYPE (#74) variant G "Mix": E's header, D's circuit bar, B's prev/next on the topo, C-style search + grade filter.
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { circuitLabel, isOnCircuit, PendingTag, SegmentBar, Subarea, TopoFrame } from "./parts";
import { heading, RADIUS, useCircuitNav, useSender } from "./sender";
import { SignalChrome } from "./SignalChrome";
import type { VariantProps } from "./types";

function PhotoNav({ dir, onPress }: { dir: "prev" | "next"; onPress: () => void }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={dir === "prev" ? "Previous problem" : "Next problem"}
      className="items-center justify-center"
      style={{ width: 40, height: 40, borderRadius: RADIUS, backgroundColor: "rgba(17,17,16,0.55)" }}
    >
      <Icon size={22} color="#FFFFFF" strokeWidth={3} />
    </Pressable>
  );
}

function SolidSheet({
  isOpen,
  onClose,
  color,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  color: string;
  children: React.ReactNode;
}) {
  const sheet = useRef<TrueSheet>(null);
  const presented = useRef(false);

  useEffect(() => {
    if (isOpen === presented.current) return;
    presented.current = isOpen;
    const action = isOpen ? sheet.current?.present() : sheet.current?.dismiss();
    action?.catch((e: unknown) => console.error("Sheet transition failed", e));
  }, [isOpen]);

  function handleDidDismiss() {
    if (!presented.current) return;
    presented.current = false;
    onClose();
  }

  return (
    <TrueSheet
      ref={sheet}
      grabber
      cornerRadius={24}
      detents={[0.5, 1]}
      dimmed={false}
      backgroundColor={color}
      onDidDismiss={handleDidDismiss}
    >
      {children}
    </TrueSheet>
  );
}

export function VariantMix({ problem, isOpen, onClose, ...chrome }: VariantProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  const nav = useCircuitNav();
  const circuit = problem ? isOnCircuit(problem) : false;

  return (
    <>
      <SignalChrome {...chrome} />

      <SolidSheet isOpen={isOpen} onClose={onClose} color={t.bg}>
        {problem && (
          <View style={{ paddingBottom: insets.bottom + 16 }}>
            <TopoFrame problem={problem} t={t}>
              {(nav.canPrev || nav.canNext) && (
                <View className="absolute bottom-3 right-3 flex-row" style={{ gap: 8 }}>
                  {nav.canPrev && <PhotoNav dir="prev" onPress={nav.prev} />}
                  {nav.canNext && <PhotoNav dir="next" onPress={nav.next} />}
                </View>
              )}
            </TopoFrame>

            <View className="px-5 pt-4" style={{ gap: 8 }}>
              <Text
                numberOfLines={2}
                style={[heading, { color: t.ink, fontSize: 26, lineHeight: 30, textTransform: "none" }]}
              >
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
              {circuit && nav.total > 1 && nav.index >= 0 && (
                <View className="flex-row items-center" style={{ gap: 10, marginTop: 4 }}>
                  <View className="flex-1">
                    <SegmentBar index={nav.index} total={nav.total} t={t} />
                  </View>
                  <Text style={{ color: t.muted, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] }}>
                    {nav.index + 1} of {nav.total}
                  </Text>
                </View>
              )}
            </View>

            {problem.description && (
              <Text className="px-5 pt-4" style={{ color: t.ink, fontSize: 16, lineHeight: 23 }}>
                {problem.description}
              </Text>
            )}
          </View>
        )}
      </SolidSheet>
    </>
  );
}
