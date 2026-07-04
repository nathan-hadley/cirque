// R2 key layout and variant dimensions for topo images (ADR 0001 §6).
// Shared contract: imported by the migration script and the Worker.
export const TOPO_VARIANTS = {
  full: { width: 640, height: 480 },
  thumb: { width: 320, height: 240 },
};

export function topoKeys(slug) {
  return {
    full: `topos/${slug}/full.webp`,
    thumb: `topos/${slug}/thumb.webp`,
    original: `originals/${slug}.jpeg`,
  };
}
