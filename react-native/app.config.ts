import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Cirque",
  slug: "Cirque",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nathan-hadley.Cirque"
  },
  android: {
    package: "com.nathanhadley.Cirque",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ],
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_ACCESS_TOKEN
      }
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Cirque requires your location to enable GPS navigation between boulder problems. For example, you will be able to see your location on the map and how close you are to a boulder."
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  }
}); 