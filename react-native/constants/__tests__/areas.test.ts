import { CirqueData } from "@/stores/dataStore";
import { leavenworthAreas } from "../areas";

const data: CirqueData = {
  problems: { type: "FeatureCollection", features: [] },
  areas: { type: "FeatureCollection", features: [] },
  boulders: { type: "FeatureCollection", features: [] },
  subareaPolygons: { type: "FeatureCollection", features: [] },
  subareaCenters: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Zeta" },
        geometry: { type: "Point", coordinates: [0, 0] },
      },
      {
        type: "Feature",
        properties: { name: "Alpha" },
        geometry: { type: "Point", coordinates: [0, 0] },
      },
      {
        type: "Feature",
        properties: { name: "Zeta" },
        geometry: { type: "Point", coordinates: [0, 0] },
      },
      { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } },
    ],
  },
};

it("deduplicates and sorts Leavenworth area names", () => {
  expect(leavenworthAreas(data)).toEqual(["Alpha", "Zeta"]);
});
