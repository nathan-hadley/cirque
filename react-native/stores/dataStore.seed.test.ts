import seed from "@/assets/seed.json";
import { normalizePayload, useDataStore } from "./dataStore";

// This suite deliberately does NOT mock @/assets/seed.json so it guards the
// real bundled seed: a corrupted or badly regenerated seed.json should fail here.
describe("bundled seed.json", () => {
  it("normalizes into a usable dataset", () => {
    const data = normalizePayload(seed);
    expect(data).not.toBeNull();
    expect(data!.problems.features.length).toBeGreaterThan(100);
    expect(data!.subareaPolygons.features.length).toBeGreaterThan(0);
    expect(data!.subareaCenters.features.length).toBeGreaterThan(0);
  });

  it("initializes the store from the bundled seed", () => {
    const { data } = useDataStore.getState();
    expect(data.problems.features.length).toBeGreaterThan(100);
  });
});
