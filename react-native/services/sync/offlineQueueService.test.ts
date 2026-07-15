import { ProblemSubmission } from "@/types/problemSubmission";
import { generateId, offlineQueueService } from "./offlineQueueService";

const mockStorage = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
  },
}));

const submission = (id: string): ProblemSubmission => ({
  id,
  contact: { name: "Climber", email: "climber@example.com" },
  problem: {
    name: "Problem",
    grade: "V3",
    subarea: "Area",
    description: "Desc",
    lat: 1,
    lng: 2,
    line: [],
  },
});

describe("offlineQueueService", () => {
  beforeEach(async () => {
    mockStorage.clear();
    await offlineQueueService.clearQueue();
  });

  it("enqueues and reads submissions", async () => {
    await offlineQueueService.addSubmission(submission("one"));
    await offlineQueueService.addSubmission(submission("two"));
    expect((await offlineQueueService.getQueue()).map(item => item.id)).toEqual(["one", "two"]);
    await expect(offlineQueueService.getQueueCount()).resolves.toBe(2);
  });

  it("removes and updates queued submissions", async () => {
    await offlineQueueService.addSubmission(submission("one"));
    await offlineQueueService.addSubmission(submission("two"));
    await offlineQueueService.updateSubmission("one", { retryCount: 3, lastRetryAt: 123 });
    expect((await offlineQueueService.getQueue())[0]).toMatchObject({
      retryCount: 3,
      lastRetryAt: 123,
    });
    await offlineQueueService.removeSubmission("two");
    expect((await offlineQueueService.getQueue()).map(item => item.id)).toEqual(["one"]);
  });

  it("clears the queue", async () => {
    await offlineQueueService.addSubmission(submission("one"));
    await offlineQueueService.clearQueue();
    await expect(offlineQueueService.getQueue()).resolves.toEqual([]);
  });

  it("generates unique non-empty ids", () => {
    const first = generateId();
    const second = generateId();
    expect(first).not.toBe("");
    expect(second).not.toBe(first);
  });
});
