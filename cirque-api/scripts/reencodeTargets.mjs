import { topoKeys } from "../src/topos.mjs";

// New submissions store client JPEG bytes under the .webp variant keys
// (Workers can't run sharp). This selects manifest entries whose served
// content type is still image/jpeg so the runner can rewrite them as WebP.
export function reencodeTargets(entries, contentTypeByUrl) {
  const targets = [];
  for (const entry of entries) {
    if (contentTypeByUrl.get(entry.fullUrl) !== "image/jpeg") continue;
    const slug = entry.topoKey.replace(/^topos\//, "");
    const keys = topoKeys(slug);
    targets.push({ slug, original: keys.original, full: keys.full, thumb: keys.thumb });
  }
  return targets;
}
