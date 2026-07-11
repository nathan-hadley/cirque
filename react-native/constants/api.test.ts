import { topoImageUrl } from "./api";

describe("topoImageUrl", () => {
  it("builds variant urls from a topo key", () => {
    expect(topoImageUrl("topos/forestland-alcove", "full")).toMatch(
      /\/images\/topos\/forestland-alcove\/full\.webp$/
    );
    expect(topoImageUrl("topos/forestland-alcove", "thumb")).toMatch(
      /\/images\/topos\/forestland-alcove\/thumb\.webp$/
    );
  });

  it("returns undefined without a key", () => {
    expect(topoImageUrl(undefined, "full")).toBeUndefined();
    expect(topoImageUrl(null, "full")).toBeUndefined();
  });
});
