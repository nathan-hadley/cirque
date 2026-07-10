export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// Timeout for API fetches: long enough for large payloads on slow trailhead
// cellular, short enough that a refresh fails fast when the API is unreachable.
export const FETCH_TIMEOUT_MS = 15000;

export const API_ENDPOINTS = {
  submitProblem: `${API_BASE_URL}/v1/problems`,
  data: `${API_BASE_URL}/v1/data`,
  imagesManifest: `${API_BASE_URL}/v1/images/manifest`,
} as const;

export function apiHeaders(): Record<string, string> {
  if (!API_KEY) throw new Error("EXPO_PUBLIC_API_KEY is not set");
  return { "X-API-Key": API_KEY };
}

export function topoImageUrl(
  topoKey: string | null | undefined,
  variant: "full" | "thumb"
): string | undefined {
  if (!topoKey) return undefined;
  return `${API_BASE_URL}/images/${topoKey}/${variant}.webp`;
}
