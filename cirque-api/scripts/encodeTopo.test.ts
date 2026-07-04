import { describe, expect, test } from "vitest";
import sharp from "sharp";
import { encodeTopoVariants } from "./encodeTopo.mjs";
import { topoKeys } from "../src/topos.mjs";

async function makeJpeg(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 50, b: 50 } },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
}

describe("encodeTopoVariants", () => {
  test("produces 640×480 webp full and 320×240 webp thumb", async () => {
    const input = await makeJpeg(640, 480);

    const { full, thumb } = await encodeTopoVariants(input);

    const fullMeta = await sharp(full).metadata();
    expect(fullMeta.format).toBe("webp");
    expect(fullMeta.width).toBe(640);
    expect(fullMeta.height).toBe(480);

    const thumbMeta = await sharp(thumb).metadata();
    expect(thumbMeta.format).toBe("webp");
    expect(thumbMeta.width).toBe(320);
    expect(thumbMeta.height).toBe(240);
  });

  test("output is dramatically smaller than a q100 jpeg input", async () => {
    const input = await makeJpeg(640, 480);
    const { full } = await encodeTopoVariants(input);
    expect(full.length).toBeLessThan(input.length);
  });
});

describe("topoKeys", () => {
  test("maps slug to R2 key layout", () => {
    expect(topoKeys("forestland-alcove")).toEqual({
      full: "topos/forestland-alcove/full.webp",
      thumb: "topos/forestland-alcove/thumb.webp",
      original: "originals/forestland-alcove.jpeg",
    });
  });
});
