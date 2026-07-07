import { describe, expect, test } from "vitest";
import { reencodeTargets } from "./reencodeTargets.mjs";

describe("reencodeTargets", () => {
  test("selects only jpeg-typed topos and derives their R2 keys", () => {
    const entries = [
      { topoKey: "topos/forestland-alcove", fullUrl: "https://api/images/topos/forestland-alcove/full.webp" },
      { topoKey: "topos/1751600000000-abc123", fullUrl: "https://api/images/topos/1751600000000-abc123/full.webp" },
    ];
    const contentTypeByUrl = new Map([
      ["https://api/images/topos/forestland-alcove/full.webp", "image/webp"],
      ["https://api/images/topos/1751600000000-abc123/full.webp", "image/jpeg"],
    ]);

    expect(reencodeTargets(entries, contentTypeByUrl)).toEqual([
      {
        slug: "1751600000000-abc123",
        original: "originals/1751600000000-abc123.jpeg",
        full: "topos/1751600000000-abc123/full.webp",
        thumb: "topos/1751600000000-abc123/thumb.webp",
      },
    ]);
  });

  test("ignores entries with unknown content type", () => {
    const entries = [{ topoKey: "topos/x", fullUrl: "https://api/images/topos/x/full.webp" }];
    expect(reencodeTargets(entries, new Map())).toEqual([]);
  });
});
