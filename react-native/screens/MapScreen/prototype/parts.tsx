// PROTOTYPE (#74): shared sheet pieces for the A+B mixes (D, E, F).
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CameraOff, ChevronLeft, ChevronRight, MapPin } from "lucide-react-native";
import { Topo } from "@/components/Topo";
import { topoImageUrl } from "@/constants/api";
import type { Problem } from "@/models/problems";
import { RADIUS, type SenderTokens } from "./sender";

export function isOnCircuit(p: Problem) {
  return p.order !== undefined && !!p.colorStr;
}

export function hasTopo(p: Problem) {
  return !!(p.topoKey || p.topo);
}

export function circuitLabel(colorStr: string) {
  return `${colorStr.charAt(0).toUpperCase()}${colorStr.slice(1)} circuit`;
}

export function CircuitMarker({ problem, t, size = 26 }: { problem: Problem; t: SenderTokens; size?: number }) {
  const lightFill = problem.colorStr === "white" || problem.colorStr === "yellow";
  const needsEdge = lightFill || (problem.colorStr === "black" && t.scheme === "dark");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: problem.color,
        borderWidth: needsEdge ? 1.5 : 0,
        borderColor: lightFill ? t.line : t.faint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: lightFill ? "#111110" : "#FFFFFF",
          fontSize: size * 0.5,
          fontWeight: "800",
          fontVariant: ["tabular-nums"],
        }}
      >
        {problem.order}
      </Text>
    </View>
  );
}

export function GradeTag({ grade, t }: { grade?: string; t: SenderTokens }) {
  if (!grade) return null;
  return (
    <View style={{ backgroundColor: t.accent, borderRadius: RADIUS, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color: t.onAccent, fontWeight: "800", fontSize: 14 }}>{grade}</Text>
    </View>
  );
}

export function PendingTag({ problem, t }: { problem: Problem; t: SenderTokens }) {
  if (problem.status !== "pending") return null;
  return (
    <View style={{ borderWidth: 1, borderColor: t.line, borderRadius: RADIUS, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color: t.muted, fontSize: 13, fontWeight: "600" }}>Pending review</Text>
    </View>
  );
}

export function Subarea({ name, t }: { name?: string; t: SenderTokens }) {
  if (!name) return null;
  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
      <MapPin size={14} color={t.muted} strokeWidth={2.5} />
      <Text style={{ color: t.muted, fontSize: 15, fontWeight: "600" }}>{name}</Text>
    </View>
  );
}

export function TopoFrame({
  problem,
  t,
  radius = 0,
  children,
}: {
  problem: Problem;
  t: SenderTokens;
  radius?: number;
  children?: React.ReactNode;
}) {
  const topo = hasTopo(problem);
  return (
    <View
      className="overflow-hidden"
      style={[
        { aspectRatio: 4 / 3, borderRadius: radius, backgroundColor: topo ? t.surface : t.line },
      ]}
    >
      {topo ? (
        <Topo
          topo={problem.topo || ""}
          remoteUri={topoImageUrl(problem.topoKey, "full")}
          line={problem.line}
          color={problem.color}
        />
      ) : (
        <View className="flex-1 flex-row items-center justify-center" style={{ gap: 8 }}>
          <CameraOff size={18} color={t.muted} strokeWidth={2.25} />
          <Text style={{ color: t.muted, fontSize: 15, fontWeight: "600" }}>No topo yet</Text>
        </View>
      )}
      {children}
    </View>
  );
}

export function SegmentBar({ index, total, t }: { index: number; total: number; t: SenderTokens }) {
  const gap = total > 30 ? 2 : 3;
  return (
    <View className="flex-row" style={{ gap, height: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            borderRadius: 1,
            backgroundColor: i === index ? t.accent : i < index ? t.ink : t.line,
          }}
        />
      ))}
    </View>
  );
}

export function NavSquare({
  dir,
  enabled,
  onPress,
  t,
}: {
  dir: "prev" | "next";
  enabled: boolean;
  onPress: () => void;
  t: SenderTokens;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityLabel={dir === "prev" ? "Previous problem" : "Next problem"}
      className="items-center justify-center"
      style={{ width: 40, height: 40, borderRadius: RADIUS, backgroundColor: t.inkFill, opacity: enabled ? 1 : 0.2 }}
    >
      <Icon size={22} color={t.onInkFill} strokeWidth={3} />
    </Pressable>
  );
}

export function RouteStrip({
  problem,
  index,
  total,
  t,
}: {
  problem: Problem;
  index: number;
  total: number;
  t: SenderTokens;
}) {
  const [width, setWidth] = useState(0);
  const height = 28;
  const inset = 13;
  const x = (i: number) => inset + (total <= 1 ? 0 : (i * (width - inset * 2)) / (total - 1));
  const mid = height / 2;

  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <>
          <View style={{ position: "absolute", left: inset, right: inset, top: mid - 1, height: 2, backgroundColor: t.line }} />
          <View
            style={{ position: "absolute", left: inset, width: x(index) - inset, top: mid - 1, height: 2, backgroundColor: t.ink }}
          />
          {Array.from({ length: total }, (_, i) =>
            i === index ? null : (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: x(i) - 2,
                  top: mid - 2,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i < index ? t.ink : t.faint,
                }}
              />
            )
          )}
          <View style={{ position: "absolute", left: x(index) - inset, top: mid - inset }}>
            <CircuitMarker problem={problem} t={t} size={inset * 2} />
          </View>
        </>
      )}
    </View>
  );
}
