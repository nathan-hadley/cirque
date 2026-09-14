// PROTOTYPE (#74) variant A "Faithful": today's layout, Sender tokens applied as-is.
import { Pressable, Text, View } from "react-native";
import { GlassContainer } from "expo-glass-effect";
import { ChevronLeft, ChevronRight, LocateFixed, MapPin, Search, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Topo } from "@/components/Topo";
import { GlassSurface, isLiquidGlassAvailable } from "@/components/ui/GlassSurface";
import { Sheet } from "@/components/ui/sheet";
import { topoImageUrl } from "@/constants/api";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { circuitName, heading, label, RADIUS, useCircuitNav, useSender } from "./sender";
import type { ChromeProps, VariantProps } from "./types";

export function RoundGlassButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <GlassSurface interactive style={{ width: 48, height: 48, borderRadius: 24, overflow: "hidden" }}>
      <Pressable onPress={onPress} className="flex-1 items-center justify-center">
        {children}
      </Pressable>
    </GlassSurface>
  );
}

export function FaithfulChrome({ onSearch, onFilter, onLocate, filtered }: ChromeProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  const Controls = isLiquidGlassAvailable() ? GlassContainer : View;

  return (
    <>
      <View className="absolute left-4 right-4" style={{ top: insets.top + 12 }}>
        <GlassSurface interactive style={{ borderRadius: 999, overflow: "hidden" }}>
          <Pressable onPress={onSearch} className="flex-row items-center gap-3 px-4" style={{ height: 48 }}>
            <Search size={20} color={t.ink} strokeWidth={2.5} />
            <Text style={{ color: t.muted, fontSize: 16, fontWeight: "600" }}>Search problems</Text>
          </Pressable>
        </GlassSurface>
      </View>

      <View className="absolute right-4" style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}>
        <Controls spacing={12} style={{ gap: 12 }}>
          {filtered ? (
            <Pressable
              onPress={onFilter}
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.accent }}
            >
              <SlidersHorizontal size={22} color={t.onAccent} strokeWidth={2.5} />
            </Pressable>
          ) : (
            <RoundGlassButton onPress={onFilter}>
              <SlidersHorizontal size={22} color={t.ink} strokeWidth={2.5} />
            </RoundGlassButton>
          )}
          <RoundGlassButton onPress={onLocate}>
            <LocateFixed size={22} color={t.ink} strokeWidth={2.5} />
          </RoundGlassButton>
        </Controls>
      </View>
    </>
  );
}

export function VariantFaithful({ problem, isOpen, onClose, ...chrome }: VariantProps) {
  const t = useSender();
  const insets = useSafeAreaInsets();
  const nav = useCircuitNav();

  return (
    <>
      <FaithfulChrome {...chrome} />

      <Sheet isOpen={isOpen} onClose={onClose} detents={[0.5, 1]} dimmed={false}>
        {problem && (
          <>
            <View className="w-full aspect-[4/3] overflow-hidden relative" style={{ backgroundColor: t.surface }}>
              <Topo
                topo={problem.topo || ""}
                remoteUri={topoImageUrl(problem.topoKey, "full")}
                line={problem.line}
                color={problem.color}
              />
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
            </View>

            <View className="px-5 pt-4" style={{ gap: 8, paddingBottom: insets.bottom + 16 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
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
                <Text style={[label, { color: t.muted }]}>
                  {circuitName(problem.colorStr)}
                  {problem.order !== undefined ? `  ·  #${problem.order}` : ""}
                </Text>
              </View>
              <Text style={[heading, { color: t.ink, fontSize: 28, lineHeight: 30 }]}>
                {problem.name || "Unnamed problem"}
              </Text>
              <View className="flex-row items-center" style={{ gap: 12 }}>
                {problem.grade && (
                  <View style={{ backgroundColor: t.accent, borderRadius: RADIUS, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: t.onAccent, fontWeight: "800", fontSize: 15 }}>{problem.grade}</Text>
                  </View>
                )}
                {problem.subarea && (
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <MapPin size={14} color={t.muted} strokeWidth={2.5} />
                    <Text style={{ color: t.muted, fontSize: 15, fontWeight: "600" }}>{problem.subarea}</Text>
                  </View>
                )}
              </View>
              {problem.description && (
                <Text style={{ color: t.ink, fontSize: 16, lineHeight: 22, marginTop: 4 }}>{problem.description}</Text>
              )}
            </View>
          </>
        )}
      </Sheet>
    </>
  );
}
