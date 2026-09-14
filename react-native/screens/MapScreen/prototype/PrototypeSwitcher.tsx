// PROTOTYPE (#74): floating variant, test-problem, chrome and highlight switcher. __DEV__ only.
import { Appearance, Pressable, Text, useColorScheme, useWindowDimensions, View } from "react-native";
import { router, useGlobalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HIGHLIGHTS, toHighlight } from "./SelectedHighlight";
import { CHROMES } from "./SignalChrome";

export const VARIANTS = [
  { key: "stock", name: "Current app" },
  { key: "A", name: "Faithful" },
  { key: "B", name: "Poster" },
  { key: "D", name: "Plate" },
  { key: "E", name: "Stacked" },
  { key: "F", name: "Route" },
  { key: "G", name: "Mix" },
] as const;

export const PRESETS = [
  { key: "auto", name: "Circuit" },
  { key: "d6ff742c-412b-5cf2-858b-b2846d251b43", name: "46 red" },
  { key: "1783005356353-kobra-khan", name: "Off" },
  { key: "7293457b-d65a-5842-8628-0dd0bdc71757", name: "No #" },
  { key: "bf08b0f8-3559-56fd-88a6-49ef7abad832", name: "No topo" },
  { key: "06ec9e39-4c87-5609-8c21-6e931b08cbca", name: "Long" },
] as const;

export type VariantKey = (typeof VARIANTS)[number]["key"];

export function toVariant(v: string | undefined): VariantKey {
  return VARIANTS.find(x => x.key === v)?.key ?? "stock";
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center rounded-full" style={{ backgroundColor: "#6D28D9", padding: 2, gap: 2 }}>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-2 py-1"
      style={{ backgroundColor: active ? "rgba(255,255,255,0.3)" : "transparent" }}
    >
      <Text className="text-white font-semibold" style={{ fontSize: 11 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PrototypeSwitcher({ current, problem }: { current: VariantKey; problem?: string }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const scheme = useColorScheme();
  const { c, h } = useGlobalSearchParams<{ c?: string; h?: string }>();
  const i = VARIANTS.findIndex(x => x.key === current);
  const highlight = toHighlight(h);

  function cycle(step: number) {
    const next = VARIANTS[(i + step + VARIANTS.length) % VARIANTS.length];
    router.setParams({ v: next.key });
  }

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ top: Math.max(insets.top + 110, height * 0.5 - 112), gap: 6 }}
    >
      <View
        className="flex-row items-center rounded-full"
        style={{ backgroundColor: "#6D28D9", paddingHorizontal: 4, paddingVertical: 2 }}
      >
        <Pressable onPress={() => cycle(-1)} hitSlop={8} className="px-3 py-1">
          <Text className="text-white text-base font-bold">‹</Text>
        </Pressable>
        <Text className="text-white text-xs font-semibold">
          {current}: {VARIANTS[i].name}
        </Text>
        <Pressable onPress={() => cycle(1)} hitSlop={8} className="px-3 py-1">
          <Text className="text-white text-base font-bold">›</Text>
        </Pressable>
        <Pressable
          onPress={() => Appearance.setColorScheme(scheme === "dark" ? "light" : "dark")}
          hitSlop={8}
          className="px-3 py-1 border-l border-white/30"
        >
          <Text className="text-white text-xs font-semibold">{scheme === "dark" ? "C1" : "C3"}</Text>
        </Pressable>
      </View>
      <Row>
        {PRESETS.map(preset => (
          <Chip
            key={preset.key}
            label={preset.name}
            active={preset.key === problem}
            onPress={() => router.setParams({ p: preset.key })}
          />
        ))}
      </Row>
      <Row>
        {current === "G" &&
          CHROMES.map(chrome => (
            <Chip
              key={chrome.key}
              label={chrome.name}
              active={(c ?? "1") === chrome.key}
              onPress={() => router.setParams({ c: chrome.key })}
            />
          ))}
        {HIGHLIGHTS.map(option => (
          <Chip
            key={option.key}
            label={option.name}
            active={highlight === option.key}
            onPress={() => router.setParams({ h: option.key })}
          />
        ))}
      </Row>
    </View>
  );
}
