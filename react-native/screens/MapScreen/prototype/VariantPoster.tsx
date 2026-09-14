// PROTOTYPE (#74) variant B "Poster": type leads. Grade numeral + name above the topo, wordmark in the search bar, one control rail.
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight, LocateFixed, Search, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Topo } from "@/components/Topo";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Sheet } from "@/components/ui/sheet";
import { topoImageUrl } from "@/constants/api";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { circuitName, heading, label, pad, RADIUS, useCircuitNav, useSender } from "./sender";
import type { ChromeProps, VariantProps } from "./types";

export function PosterChrome({ onSearch, onFilter, onLocate, filtered }: ChromeProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();

  return (
    <>
      <View className="absolute left-4 right-4" style={{ top: insets.top + 8 }}>
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
      </View>

      <View className="absolute right-4" style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}>
        <GlassSurface interactive style={{ width: 52, borderRadius: 8, overflow: "hidden" }}>
          <Pressable onPress={onFilter} className="items-center justify-center" style={{ height: 52 }}>
            <SlidersHorizontal size={22} color={filtered ? t.accent : t.ink} strokeWidth={2.75} />
            {filtered && (
              <View style={{ position: "absolute", top: 10, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent }} />
            )}
          </Pressable>
          <View style={{ height: 1, marginHorizontal: 10, backgroundColor: t.line }} />
          <Pressable onPress={onLocate} className="items-center justify-center" style={{ height: 52 }}>
            <LocateFixed size={22} color={t.ink} strokeWidth={2.75} />
          </Pressable>
        </GlassSurface>
      </View>
    </>
  );
}

export function VariantPoster({ problem, isOpen, onClose, ...chrome }: VariantProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  const nav = useCircuitNav();

  return (
    <>
      <PosterChrome {...chrome} />

      <Sheet isOpen={isOpen} onClose={onClose} detents={[0.5, 1]} dimmed={false}>
        {problem && (
          <View style={{ paddingBottom: insets.bottom + 16 }}>
            <View className="flex-row px-5 pt-6" style={{ gap: 14 }}>
              <Text
                style={{ color: t.accent, fontSize: 64, lineHeight: 64, fontWeight: "900", letterSpacing: -3 }}
              >
                {problem.grade ?? "V?"}
              </Text>
              <View className="flex-1 justify-center" style={{ gap: 4 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <View
                    style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: problem.color, borderWidth: 1, borderColor: t.line }}
                  />
                  <Text style={[label, { color: t.muted }]}>
                    {circuitName(problem.colorStr)}
                    {nav.total > 0 ? `  ${pad(nav.index + 1)} / ${pad(nav.total)}` : ""}
                  </Text>
                </View>
                <Text numberOfLines={2} style={[heading, { color: t.ink, fontSize: 24, lineHeight: 25 }]}>
                  {problem.name || "Unnamed problem"}
                </Text>
                {problem.subarea && (
                  <Text style={{ color: t.muted, fontSize: 14, fontWeight: "600" }}>{problem.subarea}</Text>
                )}
              </View>
            </View>

            {nav.total > 1 && (
              <View className="flex-row px-5 pt-4" style={{ gap: 3 }}>
                {Array.from({ length: nav.total }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 1,
                      backgroundColor: i === nav.index ? t.accent : i < nav.index ? t.ink : t.line,
                    }}
                  />
                ))}
              </View>
            )}

            <View className="mx-5 mt-4 aspect-[4/3] overflow-hidden" style={{ borderRadius: 8, backgroundColor: t.surface }}>
              <Topo
                topo={problem.topo || ""}
                remoteUri={topoImageUrl(problem.topoKey, "full")}
                line={problem.line}
                color={problem.color}
              />
              <View className="absolute bottom-3 right-3 flex-row" style={{ gap: 8 }}>
                {[
                  { show: nav.canPrev, onPress: nav.prev, Icon: ChevronLeft },
                  { show: nav.canNext, onPress: nav.next, Icon: ChevronRight },
                ].map(({ show, onPress, Icon }, i) =>
                  show ? (
                    <Pressable
                      key={i}
                      onPress={onPress}
                      className="items-center justify-center"
                      style={{ width: 44, height: 44, borderRadius: RADIUS, backgroundColor: t.inkFill }}
                    >
                      <Icon size={24} color={t.onInkFill} strokeWidth={3} />
                    </Pressable>
                  ) : null
                )}
              </View>
            </View>

            {problem.description && (
              <Text className="px-5 pt-4" style={{ color: t.ink, fontSize: 16, lineHeight: 22 }}>
                {problem.description}
              </Text>
            )}
          </View>
        )}
      </Sheet>
    </>
  );
}
