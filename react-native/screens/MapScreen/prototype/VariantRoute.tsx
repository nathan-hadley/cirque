// PROTOTYPE (#74) variant F "Route": A's full-bleed topo, a circuit strip that echoes the map's numbered markers, grade beside the name.
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight, LocateFixed, Search, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Sheet } from "@/components/ui/sheet";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { circuitLabel, isOnCircuit, PendingTag, RouteStrip, Subarea, TopoFrame } from "./parts";
import { heading, useCircuitNav, useSender } from "./sender";
import type { ChromeProps, VariantProps } from "./types";
import { RoundGlassButton } from "./VariantFaithful";

function RouteChrome({ onSearch, onFilter, onLocate, filtered }: ChromeProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();

  return (
    <>
      <View className="absolute left-4 right-4" style={{ top: insets.top + 12 }}>
        <GlassSurface interactive style={{ borderRadius: 999, overflow: "hidden" }}>
          <Pressable
            onPress={onSearch}
            className="flex-row items-center"
            style={{ height: 50, paddingLeft: 20, paddingRight: 16, gap: 12 }}
          >
            <Text style={[heading, { color: t.accent, fontSize: 16, letterSpacing: -0.3 }]}>Cirque</Text>
            <View style={{ width: 1, height: 20, backgroundColor: t.line }} />
            <Text style={{ flex: 1, color: t.muted, fontSize: 16, fontWeight: "600" }}>Search problems</Text>
            <Search size={20} color={t.ink} strokeWidth={2.5} />
          </Pressable>
        </GlassSurface>
      </View>

      <View className="absolute right-4" style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}>
        <GlassSurface interactive style={{ width: 50, borderRadius: 25, overflow: "hidden" }}>
          <Pressable onPress={onFilter} className="items-center justify-center" style={{ height: 54 }}>
            <SlidersHorizontal size={22} color={filtered ? t.accent : t.ink} strokeWidth={2.5} />
            {filtered && (
              <View
                style={{ position: "absolute", top: 12, right: 11, width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent }}
              />
            )}
          </Pressable>
          <View style={{ height: 1, marginHorizontal: 12, backgroundColor: t.line }} />
          <Pressable onPress={onLocate} className="items-center justify-center" style={{ height: 54 }}>
            <LocateFixed size={22} color={t.ink} strokeWidth={2.5} />
          </Pressable>
        </GlassSurface>
      </View>
    </>
  );
}

export function VariantRoute({ problem, isOpen, onClose, ...chrome }: VariantProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  const nav = useCircuitNav();
  const circuit = problem ? isOnCircuit(problem) : false;

  return (
    <>
      <RouteChrome {...chrome} />

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

            <View className="px-5" style={{ paddingTop: circuit ? 14 : 18, gap: 10, paddingBottom: insets.bottom + 16 }}>
              {circuit && nav.total > 1 && <RouteStrip problem={problem} index={nav.index} total={nav.total} t={t} />}

              <View className="flex-row items-start" style={{ gap: 12 }}>
                <Text numberOfLines={2} style={[heading, { flex: 1, color: t.ink, fontSize: 26, lineHeight: 28 }]}>
                  {problem.name || "Unnamed problem"}
                </Text>
                {problem.grade && (
                  <Text style={{ color: t.accent, fontSize: 22, lineHeight: 28, fontWeight: "900", letterSpacing: -0.5 }}>
                    {problem.grade}
                  </Text>
                )}
              </View>

              <View className="flex-row flex-wrap items-center" style={{ columnGap: 14, rowGap: 6 }}>
                {circuit && nav.total > 0 && (
                  <Text style={{ color: t.muted, fontSize: 15, fontWeight: "600" }}>
                    {circuitLabel(problem.colorStr)}, {nav.index + 1} of {nav.total}
                  </Text>
                )}
                <Subarea name={problem.subarea} t={t} />
                <PendingTag problem={problem} t={t} />
              </View>

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
