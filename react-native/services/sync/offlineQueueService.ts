import type { ProblemSubmission } from "@cirque-api/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_STORAGE_KEY = "@cirque/offline-submissions";

export type QueuedSubmission = {
  id: string;
  submission: ProblemSubmission;
  timestamp: number;
  retryCount: number;
  lastRetryAt?: number;
  idempotencyKey: string;
};

/**
 * Generate a unique ID using timestamp and random number
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a unique idempotency key using UUID v4 format
 * This ensures the same submission can be safely retried without duplicates
 */
function generateIdempotencyKey(): string {
  // Generate UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class OfflineQueueService {
  /**
   * Add a submission to the offline queue
   * @param idempotencyKey Optional idempotency key to use. If not provided, one will be generated.
   */
  async addSubmission(submission: ProblemSubmission, idempotencyKey?: string): Promise<string> {
    const id = generateId();
    const key = idempotencyKey || generateIdempotencyKey();
    const queuedSubmission: QueuedSubmission = {
      id,
      submission,
      timestamp: Date.now(),
      retryCount: 0,
      idempotencyKey: key,
    };

    const queue = await this.getQueue();
    queue.push(queuedSubmission);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

    return id;
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
      const queue = JSON.parse(data) as QueuedSubmission[];
      
      // Migration: ensure all queued submissions have idempotency keys
      // This handles submissions queued before the idempotency key feature was added
      let needsUpdate = false;
      const migratedQueue = queue.map(item => {
        if (!item.idempotencyKey) {
          needsUpdate = true;
          return {
            ...item,
            idempotencyKey: generateIdempotencyKey(),
          };
        }
        return item;
      });
      
      if (needsUpdate) {
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(migratedQueue));
      }
      
      return migratedQueue;
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
