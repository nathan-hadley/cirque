import sharp from "sharp";
import { TOPO_VARIANTS } from "../src/topos.mjs";

export async function encodeTopoVariants(input) {
  const { full: f, thumb: t } = TOPO_VARIANTS;
  const full = await sharp(input).resize(f.width, f.height).webp({ quality: 80 }).toBuffer();
  const thumb = await sharp(input).resize(t.width, t.height).webp({ quality: 80 }).toBuffer();
  return { full, thumb };
}
