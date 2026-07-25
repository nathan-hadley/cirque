/**
 * PROTOTYPE — throwaway. Feeds app/design-prototype.tsx (issue #71).
 *
 * Sender-family visual identity (near-black ink + energetic accent, sharp
 * corners, heavy uppercase headings) explored *through native iOS glass*. Each
 * option is judged on a map frame — a topographic backdrop with real
 * GlassSurface controls floating over it — because glass only reads over
 * content. Options differ in accent hue and light-vs-dark glass treatment.
 *
 * Glass itself comes from the app's real GlassSurface (Liquid Glass on iOS 26,
 * BlurView on older iOS, frosted solid on Android) so what you see degrades the
 * way the shipping app does. When one wins, its palette folds into
 * components/ui/gluestack-ui-provider/config.ts and the accent becomes a token.
 */
import { vars } from "nativewind";

export type DesignVariant = {
  key: string;
  name: string;
  tagline: string;
  vibe: string;
  /** brand accent — CTA, active glass controls, route line, grade pill */
  accent: string;
  /** legible foreground on top of `accent` */
  accentFg: string;
  /** corner radius (px) for cards + buttons (pills stay 999) */
  radius: number;
  heading: { weight: "700" | "800" | "900"; letterSpacing: number; uppercase: boolean };
  /** map/topo backdrop tone the glass sits over */
  base: "dark" | "light";
  /** optional warm/cool wash over the glass to tint it toward the accent */
  glassTint?: string;
  /** gluestack CSS-var overrides (kept minimal — the frame is over content) */
  themeVars: ReturnType<typeof vars>;
};

const senderRamp = vars({
  "--color-primary-0": "236 236 234",
  "--color-primary-500": "58 58 55",
  "--color-primary-700": "33 33 31",
  "--color-primary-900": "17 17 16",
  "--color-typography-600": "92 92 88",
  "--color-typography-700": "51 51 49",
  "--color-typography-900": "17 17 16",
  "--color-outline-200": "224 224 220",
});

export const VARIANTS: DesignVariant[] = [
  {
    key: "C1",
    name: "Coral Glass",
    tagline: "Dark topo · neutral system glass",
    vibe: "Charcoal map, clear glass, electric coral punch. The purest Sender + native glass.",
    accent: "#FF4D3D",
    accentFg: "#FFFFFF",
    radius: 8,
    heading: { weight: "800", letterSpacing: -0.6, uppercase: true },
    base: "dark",
    themeVars: senderRamp,
  },
  {
    key: "C2",
    name: "Expedition",
    tagline: "Dark topo · warm-tinted glass",
    vibe: "Safety-orange accent with subtly warm glass. Mountaineering / expedition energy.",
    accent: "#FF7A1A",
    accentFg: "#1A1206",
    radius: 8,
    heading: { weight: "800", letterSpacing: -0.6, uppercase: true },
    base: "dark",
    glassTint: "rgba(255,122,26,0.12)",
    themeVars: senderRamp,
  },
  {
    key: "C3",
    name: "Chalk",
    tagline: "Light topo · frosted white glass",
    vibe: "Granite-light map, chalk-frost glass, coral kept as the punch. Sender bones, airy daylight.",
    accent: "#FF4D3D",
    accentFg: "#FFFFFF",
    radius: 8,
    heading: { weight: "800", letterSpacing: -0.6, uppercase: true },
    base: "light",
    themeVars: senderRamp,
  },
];

/** Colors that depend on the map base rather than brand tokens. */
export function baseColors(v: DesignVariant) {
  return v.base === "dark"
    ? {
        bg: "#0E0F11",
        contour: "rgba(255,255,255,0.09)",
        contourStrong: "rgba(255,255,255,0.16)",
        fg: "#F5F5F5",
        fgMuted: "rgba(255,255,255,0.72)",
        chipBg: "rgba(255,255,255,0.10)",
        controlIcon: "#FFFFFF",
      }
    : {
        bg: "#E9EBEE",
        contour: "rgba(0,0,0,0.08)",
        contourStrong: "rgba(0,0,0,0.16)",
        fg: "#171716",
        fgMuted: "rgba(0,0,0,0.58)",
        chipBg: "rgba(0,0,0,0.06)",
        controlIcon: "#171716",
      };
}
