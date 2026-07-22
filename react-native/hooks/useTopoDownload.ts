import { useState } from "react";
import { Image } from "expo-image";
import pLimit from "p-limit";
import { API_ENDPOINTS, apiHeaders, FETCH_TIMEOUT_MS } from "@/constants/api";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type ManifestEntry = { topoKey: string; fullUrl: string; thumbUrl: string; bytes: number };

export type TopoDownloadResult = { ok: number; failed: number; total: number };

/** Max concurrent `Image.prefetch` calls kept in flight during a download. */
export const PREFETCH_CONCURRENCY = 10;

/**
 * Prefetch every url into expo-image's disk cache with a sliding-window
 * concurrency limit, so up to PREFETCH_CONCURRENCY requests stay in flight
 * continuously (vs. waiting for the slowest item in each fixed batch).
 */
export async function prefetchAll(
  urls: string[],
  onProgress?: (percent: number) => void
): Promise<TopoDownloadResult> {
  const limit = pLimit(PREFETCH_CONCURRENCY);
  let ok = 0;
  let failed = 0;
  let settled = 0;

  await Promise.all(
    urls.map(url =>
      limit(async () => {
        const success = await Image.prefetch(url, { cachePolicy: "disk" }).catch(error => {
          console.warn("Topo prefetch failed:", url, error);
          return false;
        });
        if (success) ok++;
        else failed++;
        settled++;
        onProgress?.(Math.round((settled / urls.length) * 100));
      })
    )
  );

  return { ok, failed, total: urls.length };
}

/**
 * "Download topo images" (ADR 0001): walk the manifest and prefetch every
 * variant into expo-image's disk cache so topos render offline.
 */
export function useTopoDownload() {
  const { isOnline } = useNetworkStatus();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  async function downloadAllTopos(): Promise<TopoDownloadResult> {
    if (!isOnline) throw new Error("No internet connection. Connect and try again.");
    setDownloading(true);
    setProgress(0);
    setDone(false);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(API_ENDPOINTS.imagesManifest, {
          headers: apiHeaders(),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) throw new Error(`Manifest request failed: ${res.status}`);
      const manifest: ManifestEntry[] = await res.json();

      const urls = manifest.flatMap(e =>
        e.thumbUrl === e.fullUrl ? [e.fullUrl] : [e.fullUrl, e.thumbUrl]
      );
      const { ok, failed, total } = await prefetchAll(urls, setProgress);
      setDone(failed === 0 && ok > 0);
      return { ok, failed, total };
    } finally {
      setDownloading(false);
    }
  }

  return { downloading, progress, done, downloadAllTopos };
}
