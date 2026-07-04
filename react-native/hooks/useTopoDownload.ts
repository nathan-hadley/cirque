import { useState } from "react";
import { Image } from "expo-image";
import { API_ENDPOINTS, apiHeaders } from "@/constants/api";

type ManifestEntry = { topoKey: string; fullUrl: string; thumbUrl: string; bytes: number };

/**
 * "Download topo images" (ADR 0001): walk the manifest and prefetch every
 * variant into expo-image's disk cache so topos render offline.
 */
export function useTopoDownload() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  async function downloadAllTopos(): Promise<{ ok: number; failed: number }> {
    setDownloading(true);
    setProgress(0);
    setDone(false);
    try {
      const res = await fetch(API_ENDPOINTS.imagesManifest, { headers: apiHeaders() });
      if (!res.ok) throw new Error(`Manifest request failed: ${res.status}`);
      const manifest: ManifestEntry[] = await res.json();

      const urls = manifest.flatMap(e =>
        e.thumbUrl === e.fullUrl ? [e.fullUrl] : [e.fullUrl, e.thumbUrl]
      );
      let ok = 0;
      let failed = 0;
      const CHUNK = 10;
      for (let i = 0; i < urls.length; i += CHUNK) {
        const chunk = urls.slice(i, i + CHUNK);
        const results = await Promise.all(
          chunk.map(url => Image.prefetch(url, { cachePolicy: "disk" }).catch(() => false))
        );
        ok += results.filter(Boolean).length;
        failed += results.filter(r => !r).length;
        setProgress(Math.round(((i + chunk.length) / urls.length) * 100));
      }
      setDone(failed === 0 && ok > 0);
      return { ok, failed };
    } finally {
      setDownloading(false);
    }
  }

  return { downloading, progress, done, downloadAllTopos };
}
