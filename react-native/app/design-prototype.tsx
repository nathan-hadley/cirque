/**
 * PROTOTYPE ROUTE — throwaway (issue #71). cirque://design-prototype (?v=0|1|2).
 *
 * Sender-family visual identity explored on a real map frame: a topographic
 * backdrop (Cirque's own domain) with actual GlassSurface controls floating
 * over it — search pill, side controls, and a frosted problem card — so the
 * native iOS glass is judged over content, the way it ships. Flip options with
 * the floating bottom bar. Gated on __DEV__.
 */
import { useEffect, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, Compass, MapPin, Search, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { baseColors, DesignVariant, VARIANTS } from "@/constants/designPrototype";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/** Topographic contour backdrop — two peaks + a coloured route line with markers. */
function TopoBackground({ v }: { v: DesignVariant }) {
  const c = baseColors(v);
  const rings = [1, 2, 3, 4, 5, 6, 7];
  const peak = (cx: number, cy: number, step: number) =>
    rings.map((r) => (
      <Ellipse
        key={`${cx}-${cy}-${r}`}
        cx={cx}
        cy={cy}
        rx={r * step}
        ry={r * step * 0.78}
        stroke={r <= 2 ? c.contourStrong : c.contour}
        strokeWidth={1.5}
        fill="none"
      />
    ));
  const routeD = `M ${SCREEN_W * 0.16} ${SCREEN_H * 0.34} C ${SCREEN_W * 0.34} ${SCREEN_H * 0.28}, ${SCREEN_W * 0.4} ${SCREEN_H * 0.5}, ${SCREEN_W * 0.58} ${SCREEN_H * 0.5} S ${SCREEN_W * 0.82} ${SCREEN_H * 0.42}, ${SCREEN_W * 0.86} ${SCREEN_H * 0.6}`;
  const markers = [
    [SCREEN_W * 0.16, SCREEN_H * 0.34],
    [SCREEN_W * 0.4, SCREEN_H * 0.5],
    [SCREEN_W * 0.58, SCREEN_H * 0.5],
    [SCREEN_W * 0.86, SCREEN_H * 0.6],
  ];
  return (
    <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.bg }}>
      <Svg width={SCREEN_W} height={SCREEN_H}>
        {peak(SCREEN_W * 0.28, SCREEN_H * 0.32, 26)}
        {peak(SCREEN_W * 0.78, SCREEN_H * 0.66, 30)}
        <Path d={routeD} stroke={v.accent} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" fill="none" />
        {markers.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={7} fill={v.accent} stroke={c.bg} strokeWidth={2.5} />
        ))}
      </Svg>
    </View>
  );
}

function GlassRound({ v, icon, active }: { v: DesignVariant; icon: React.ReactNode; active?: boolean }) {
  return (
    <GlassSurface interactive style={{ width: 48, height: 48, borderRadius: 24, overflow: "hidden" }}>
      {v.glassTint && <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: v.glassTint }} />}
      {active && <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: v.accent, opacity: 0.9 }} />}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>{icon}</View>
    </GlassSurface>
  );
}

function MapFrame({ v }: { v: DesignVariant }) {
  const insets = useSafeAreaInsets();
  const c = baseColors(v);
  const heading = (size: number) => ({
    fontWeight: v.heading.weight,
    letterSpacing: v.heading.letterSpacing,
    textTransform: "uppercase" as const,
    fontSize: size,
    color: c.fg,
  });

  return (
    <View style={{ flex: 1 }}>
      <TopoBackground v={v} />

      {/* Top: brand chip + glass search pill */}
      <View style={{ position: "absolute", top: insets.top + 10, left: 16, right: 16, gap: 10 }}>
        <View style={{ flexDirection: "row" }}>
          <GlassSurface style={{ borderRadius: 999, overflow: "hidden" }}>
            {v.glassTint && <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: v.glassTint }} />}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: v.accent }} />
              <Text style={{ ...heading(13), letterSpacing: 1 }}>Cirque</Text>
            </View>
          </GlassSurface>
        </View>

        <GlassSurface interactive style={{ borderRadius: 999, overflow: "hidden" }}>
          {v.glassTint && <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: v.glassTint }} />}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, height: 48 }}>
            <Search size={19} color={c.fgMuted} />
            <Text style={{ color: c.fgMuted, fontSize: 16 }}>Search problems…</Text>
          </View>
        </GlassSurface>
      </View>

      {/* Right side glass controls */}
      <View style={{ position: "absolute", right: 16, top: insets.top + 130, gap: 12 }}>
        <GlassRound v={v} active icon={<SlidersHorizontal size={20} color={v.accentFg} />} />
        <GlassRound v={v} icon={<Compass size={22} color={c.controlIcon} />} />
      </View>

      {/* Bottom: frosted glass problem card (floats above the switcher) */}
      <View style={{ position: "absolute", left: 12, right: 12, bottom: insets.bottom + 96 }}>
        <GlassSurface style={{ borderRadius: 22, overflow: "hidden" }}>
          {v.glassTint && <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: v.glassTint }} />}
          <View style={{ padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#2E7DD1" }} />
              <Text style={heading(22)}>Straightaways</Text>
              <View style={{ backgroundColor: v.accent, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                <Text style={{ color: v.accentFg, fontWeight: "800", fontSize: 12 }}>V2</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Text style={{ color: c.fgMuted, fontSize: 14, fontWeight: "600" }}>Blue Circuit · #7</Text>
              <MapPin size={13} color={c.fgMuted} />
              <Text style={{ color: c.fgMuted, fontSize: 14 }}>Forestland</Text>
            </View>
            <Text style={{ color: c.fgMuted, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
              A committing high-ball on clean granite, best in cool morning shade.
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable
                style={{ flex: 1, backgroundColor: v.accent, borderRadius: v.radius, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: v.accentFg, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", fontSize: 14 }}>
                  View topo
                </Text>
              </Pressable>
              <Pressable
                style={{ borderRadius: v.radius, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.chipBg === "rgba(255,255,255,0.10)" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)" }}
              >
                <Text style={{ color: c.fg, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", fontSize: 14 }}>
                  Directions
                </Text>
              </Pressable>
            </View>
          </View>
        </GlassSurface>
      </View>
    </View>
  );
}

function Switcher({ index, onPrev, onNext }: { index: number; onPrev: () => void; onNext: () => void }) {
  const insets = useSafeAreaInsets();
  const v = VARIANTS[index];
  return (
    <View style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 12 }} pointerEvents="box-none">
      <View
        style={{
          backgroundColor: "rgba(20,20,22,0.94)",
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 8,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Pressable onPress={onPrev} style={{ padding: 8 }} hitSlop={8}>
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center", fontSize: 14 }}>
            {v.key} — {v.name}
          </Text>
          <Text style={{ color: "#c7c7cc", fontSize: 11, textAlign: "center" }} numberOfLines={1}>
            {v.tagline}
          </Text>
        </View>
        <Pressable onPress={onNext} style={{ padding: 8 }} hitSlop={8}>
          <ChevronRight size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function DesignPrototype() {
  const { v: vParam } = useLocalSearchParams<{ v?: string }>();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const n = Number(vParam);
    if (Number.isInteger(n) && n >= 0 && n < VARIANTS.length) setIndex(n);
  }, [vParam]);

  if (!__DEV__) return null;

  const v = VARIANTS[index];
  return (
    <View style={[{ flex: 1 }, v.themeVars]}>
      <MapFrame v={v} />
      <Switcher
        index={index}
        onPrev={() => setIndex((i) => (i - 1 + VARIANTS.length) % VARIANTS.length)}
        onNext={() => setIndex((i) => (i + 1) % VARIANTS.length)}
      />
    </View>
  );
}
