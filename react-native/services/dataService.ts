import { File, Paths } from "expo-file-system";
import { API_ENDPOINTS, API_KEY, apiHeaders, FETCH_TIMEOUT_MS } from "@/constants/api";
import { normalizePayload, useDataStore } from "@/stores/dataStore";

/**
 * ADR 0001 data layer: rendering always reads from the store (seeded from the
 * bundled snapshot); this service hydrates it from the on-disk cache and
 * refreshes it from GET /v1/data when online. Offline behavior is unchanged.
 */
const CACHE_NAME = "cirque-data.json";

function cacheFile(): File {
  return new File(Paths.document, CACHE_NAME);
}

export function loadCachedData(): void {
  try {
    const file = cacheFile();
    if (!file.exists) return;
    const cached = JSON.parse(file.textSync());
    const data = normalizePayload(cached.payload);
    if (data) {
      useDataStore.getState().setData(data, cached.etag ?? null);
    } else {
      console.warn("Cached data file is malformed; using bundled seed");
    }
  } catch (error) {
    console.warn("Failed to load cached data, using bundled seed:", error);
  }
}

export async function refreshData(): Promise<void> {
  if (!API_KEY) {
    console.warn("EXPO_PUBLIC_API_KEY is not set; skipping data refresh");
    return;
  }
  const { etag } = useDataStore.getState();
  const headers: Record<string, string> = apiHeaders();
  if (etag) headers["If-None-Match"] = etag;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(API_ENDPOINTS.data, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (res.status === 304) return;
  if (!res.ok) throw new Error(`GET /v1/data → ${res.status}`);

  const payload = await res.json();
  const data = normalizePayload(payload);
  if (!data) throw new Error("Malformed /v1/data payload");

  const newEtag = res.headers.get("ETag");
  useDataStore.getState().setData(data, newEtag);
  try {
    cacheFile().write(JSON.stringify({ etag: newEtag, payload }));
  } catch (error) {
    console.warn("Failed to persist data cache:", error);
  }
}

export function initData(): void {
  loadCachedData();
  refreshData().catch(error => console.warn("Data refresh skipped:", error?.message));
}
