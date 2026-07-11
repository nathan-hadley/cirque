import { LAYER_IDS } from "@/constants/map";
import { useMapStore } from "./mapStore";

jest.mock("expo-location", () => ({}));
jest.mock("@rnmapbox/maps", () => ({}));

type QueryResult = { type: "FeatureCollection"; features: unknown[] };

function makeMapRef(features: unknown[]) {
  return {
    current: {
      queryRenderedFeaturesAtPoint: jest
        .fn<Promise<QueryResult>, unknown[]>()
        .mockResolvedValue({ type: "FeatureCollection", features }),
    },
  };
}

describe("handleMapTap", () => {
  it("passes layerIds as the third positional argument and returns the top feature", async () => {
    const feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { name: "Fat Lip" },
    };
    const mapRef = makeMapRef([feature]);
    useMapStore.setState({ mapRef: mapRef as never });

    const result = await useMapStore.getState().handleMapTap({ x: 10, y: 20 });

    // Regression: the layer restriction was once passed as an options object in
    // the filter slot ({ layerIds: [...] } as any), which made every tap query
    // return empty and left problem circles untappable. The signature is
    // (point, filter?, layerIds?).
    expect(mapRef.current.queryRenderedFeaturesAtPoint).toHaveBeenCalledWith([10, 20], undefined, [
      LAYER_IDS.problems,
    ]);
    expect(result).toBe(feature);
  });

  it("returns null when no feature is hit", async () => {
    useMapStore.setState({ mapRef: makeMapRef([]) as never });
    expect(await useMapStore.getState().handleMapTap({ x: 1, y: 2 })).toBeNull();
  });

  it("returns null when the map ref is not set", async () => {
    useMapStore.setState({ mapRef: null });
    expect(await useMapStore.getState().handleMapTap({ x: 1, y: 2 })).toBeNull();
  });
});
