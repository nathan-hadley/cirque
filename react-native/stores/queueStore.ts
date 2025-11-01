import { create } from "zustand";

type QueueStore = {
  count: number;
  setCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
};

export const useQueueStore = create<QueueStore>(set => ({
  count: 0,
  setCount: count => set({ count }),
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
}));
