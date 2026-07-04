// R2 key layout and variant dimensions for topo images (ADR 0001 §6).
// Shared contract: imported by the migration script and the Worker.
export const TOPO_VARIANTS = {
  full: { width: 640, height: 480 },
  thumb: { width: 320, height: 240 },
};

// D1 problems.topo_key stores this prefix; append /full.webp or /thumb.webp.
export function topoPrefix(slug) {
  return `topos/${slug}`;
}

export function topoKeys(slug) {
  return {
    full: `${topoPrefix(slug)}/full.webp`,
    thumb: `${topoPrefix(slug)}/thumb.webp`,
    original: `originals/${slug}.jpeg`,
  };
}
