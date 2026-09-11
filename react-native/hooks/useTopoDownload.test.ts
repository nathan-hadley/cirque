import { Image } from "expo-image";
import { PREFETCH_CONCURRENCY, prefetchAll } from "./useTopoDownload";

jest.mock("expo-image", () => ({ Image: { prefetch: jest.fn() } }));

const mockPrefetch = Image.prefetch as jest.Mock;

describe("prefetchAll", () => {
  beforeEach(() => jest.clearAllMocks());

  it("prefetches every url and reports success counts", async () => {
    mockPrefetch.mockResolvedValue(true);

    await expect(prefetchAll(["a", "b", "c"])).resolves.toEqual({
      ok: 3,
      failed: 0,
      total: 3,
    });
    expect(mockPrefetch).toHaveBeenCalledTimes(3);
  });

  it("counts failed prefetches without rejecting", async () => {
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
    mockPrefetch.mockImplementation((url: string) =>
      url === "b" ? Promise.reject(new Error("boom")) : Promise.resolve(true)
    );

    await expect(prefetchAll(["a", "b", "c"])).resolves.toEqual({
      ok: 2,
      failed: 1,
      total: 3,
    });
    consoleWarn.mockRestore();
  });

  it("keeps at most PREFETCH_CONCURRENCY requests in flight", async () => {
    let active = 0;
    let maxActive = 0;
    mockPrefetch.mockImplementation(
      () =>
        new Promise(resolve => {
          active++;
          maxActive = Math.max(maxActive, active);
          setImmediate(() => {
            active--;
            resolve(true);
          });
        })
    );
    const urls = Array.from({ length: PREFETCH_CONCURRENCY * 3 }, (_, i) => String(i));

    await prefetchAll(urls);

    expect(maxActive).toBe(PREFETCH_CONCURRENCY);
  });

  it("reports progress from 0 to 100", async () => {
    mockPrefetch.mockResolvedValue(true);
    const progress: number[] = [];

    await prefetchAll(["a", "b", "c", "d"], pct => progress.push(pct));

    expect(progress[progress.length - 1]).toBe(100);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
  });
});
