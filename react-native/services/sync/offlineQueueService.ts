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

/**
 * Generate a unique ID using timestamp and random number
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

class OfflineQueueService {
  /**
   * Add a submission to the offline queue
   */
  async addSubmission(submission: ProblemSubmission): Promise<string> {
    const queuedSubmission: QueuedSubmission = {
      id: submission.id,
      submission,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const queue = await this.getQueue();
    queue.push(queuedSubmission);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

    return submission.id;
  }

  /**
   * Get all queued submissions
   */
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

  /**
   * Remove a submission from the queue by ID
   */
  async removeSubmission(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Update a queued submission (e.g., increment retry count)
   */
  async updateSubmission(id: string, updates: Partial<QueuedSubmission>): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  }

  /**
   * Clear all submissions from the queue
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  }

  /**
   * Get the count of queued submissions
   */
  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
}

export const offlineQueueService = new OfflineQueueService();
