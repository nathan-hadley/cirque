import { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "dev";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "Cirque Dev" : "Cirque",
  slug: "Cirque",
  version: "1.4.2",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "cirque",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
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
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_ACCESS_TOKEN,
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Cirque requires your location to enable GPS navigation between boulder problems. For example, you will be able to see your location on the map and how close you are to a boulder.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Cirque requires accesses your photos to contribute boulders to the app.",
        cameraPermission: "Cirque requires access to your camera to take photos of boulders.",
      },
    ],
    "expo-font",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "4c69e3f4-e42c-471b-8ee6-6c292a478d71",
    },
  },
});
