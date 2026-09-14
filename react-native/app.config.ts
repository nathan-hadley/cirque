import { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "dev";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "Cirque Dev" : "Cirque",
  slug: "Cirque",
  version: "1.7.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: IS_DEV ? ["cirque", "cirque-dev"] : "cirque",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ...(IS_DEV && { runtimeVersion: { policy: "fingerprint" } }),
  updates: IS_DEV
    ? { url: "https://u.expo.dev/4c69e3f4-e42c-471b-8ee6-6c292a478d71" }
    : { enabled: false },
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? "com.nathanhadley.Cirque.dev" : "com.nathanhadley.Cirque",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    softwareKeyboardLayoutMode: "pan",
    package: IS_DEV ? "com.nathanhadley.Cirque.dev" : "com.nathanhadley.Cirque",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff",
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    ["@rnmapbox/maps", {}],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Cirque uses your location while you have the app open to show where you are on the boulder map. For example, tapping the locate button centers the map on you so you can see which boulders are closest, and tapping “Use my location” fills in the coordinates when you add a new boulder.",
        // Cirque only reads location in the foreground, so the background/always
        // keys are removed rather than shipped with Expo's generic defaults.
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Cirque uses your photo library so you can attach photos to boulders you contribute. For example, you can pick a photo of a boulder from your library to upload with the problem you're adding.",
        cameraPermission:
          "Cirque uses your camera so you can take a photo of a boulder while contributing it. For example, you can snap a picture of the boulder in front of you and attach it to the problem you're adding.",
        // Cirque never records audio or video, so no microphone key is shipped.
        microphonePermission: false,
      },
    ],
    "expo-font",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "4c69e3f4-e42c-471b-8ee6-6c292a478d71",
    },
  },
});
