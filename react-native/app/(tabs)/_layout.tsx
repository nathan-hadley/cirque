import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Icon
          sf={{ default: "map", selected: "map.fill" }}
          androidSrc={<VectorIcon family={MaterialIcons} name="map" />}
        />
        <Label>Map</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="about">
        <Icon
          sf={{ default: "info.circle", selected: "info.circle.fill" }}
          androidSrc={<VectorIcon family={MaterialIcons} name="info" />}
        />
        <Label>About</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="contribute">
        <Icon
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
          androidSrc={<VectorIcon family={MaterialIcons} name="add-circle" />}
        />
        <Label>Contribute</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
