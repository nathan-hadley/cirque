import type { ProblemSubmission } from "@cirque-api/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_STORAGE_KEY = "@cirque/offline-submissions";

export type QueuedSubmission = {
  id: string;
  submission: ProblemSubmission;
  timestamp: number;
  retryCount: number;
  lastRetryAt?: number;
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

class OfflineQueueService {
  async addSubmission(submission: ProblemSubmission): Promise<string> {
    const id = submission.id || generateId();
    const queuedSubmission: QueuedSubmission = {
      id,
      submission,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const queue = await this.getQueue();
    queue.push(queuedSubmission);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

    return id;
  }

  async getQueue(): Promise<QueuedSubmission[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as QueuedSubmission[];
    } catch (error) {
      console.error("Error reading queue from storage:", error);
      return [];
    }
  }

  async removeSubmission(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  }

  async updateSubmission(id: string, updates: Partial<QueuedSubmission>): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  }

  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
}

export const offlineQueueService = new OfflineQueueService();
