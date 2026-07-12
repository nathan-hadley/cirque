import { useQueueStore } from "../queueStore";

describe("useQueueStore", () => {
  beforeEach(() => useQueueStore.getState().setCount(0));

  it("sets, increments, and decrements the queue count", () => {
    const store = useQueueStore.getState();
    store.increment();
    expect(useQueueStore.getState().count).toBe(1);
    useQueueStore.getState().decrement();
    expect(useQueueStore.getState().count).toBe(0);
    useQueueStore.getState().setCount(4);
    expect(useQueueStore.getState().count).toBe(4);
  });
});
