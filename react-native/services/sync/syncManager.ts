import * as Network from "expo-network";
import type { ProblemSubmission } from "@cirque-api/types";
import axios from "axios";
import { submitProblem } from "@/api/problems";
import { offlineQueueService, type QueuedSubmission } from "./offlineQueueService";

type SyncState = {
  isSyncing: boolean;
  queueCount: number;
};

type SyncCallbacks = {
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
  onSubmissionSuccess?: (queuedSubmission: QueuedSubmission) => void;
  onSubmissionFailure?: (queuedSubmission: QueuedSubmission, error: Error) => void;
  onQueueChange?: (count: number) => void;
};

class SyncManager {
  private isSyncing = false;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private callbacks: SyncCallbacks = {};
  private queueCount = 0;

  private getBackoffDelay(retryCount: number): number {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 60000);
    return delay;
  }

  private async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isInternetReachable === true;
    } catch (error) {
      console.error("Network connectivity check failed:", error);
      return false;
    }
  }

  private async processSubmission(queuedSubmission: QueuedSubmission): Promise<void> {
    try {
      await submitProblem(queuedSubmission.submission);

      // Success - remove from queue
      await offlineQueueService.removeSubmission(queuedSubmission.id);
      this.queueCount--;
      this.callbacks.onQueueChange?.(this.queueCount);

      this.callbacks.onSubmissionSuccess?.(queuedSubmission);

      // Continue processing queue
      await this.processQueue();
    } catch (error) {
      const submissionError = error instanceof Error ? error : new Error(String(error));

      const isNetworkError =
        axios.isAxiosError(error) &&
        (!error.response || error.code === "ERR_NETWORK" || error.code === "ECONNABORTED");

      if (isNetworkError) {
        const newRetryCount = queuedSubmission.retryCount + 1;
        const delay = this.getBackoffDelay(newRetryCount);

        await offlineQueueService.updateSubmission(queuedSubmission.id, {
          retryCount: newRetryCount,
          lastRetryAt: Date.now(),
        });

        this.callbacks.onSubmissionFailure?.(queuedSubmission, submissionError);

        this.isSyncing = false;
        this.scheduleSync(delay);
      } else {
        await offlineQueueService.removeSubmission(queuedSubmission.id);
        this.queueCount--;
        this.callbacks.onQueueChange?.(this.queueCount);
        this.callbacks.onSubmissionFailure?.(queuedSubmission, submissionError);

        await this.processQueue();
      }
    }
  }

  private async processQueue(): Promise<void> {
    const queue = await offlineQueueService.getQueue();
    this.queueCount = queue.length;
    this.callbacks.onQueueChange?.(this.queueCount);

    if (queue.length === 0) {
      this.isSyncing = false;
      this.callbacks.onSyncComplete?.();
      return;
    }

    const nextSubmission = queue[0];
    await this.processSubmission(nextSubmission);
  }

  private scheduleSync(delay: number): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.sync();
    }, delay);
  }

  async sync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }
    this.isSyncing = true;

    try {
      const online = await this.isOnline();
      if (!online) {
        this.isSyncing = false;
        return;
      }

      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = null;
      }

      this.callbacks.onSyncStart?.();
      await this.processQueue();
    } catch (error) {
      this.isSyncing = false;
      console.error("Sync error:", error);
      this.callbacks.onSyncError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  setCallbacks(callbacks: SyncCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  async getState(): Promise<SyncState> {
    const queue = await offlineQueueService.getQueue();
    return {
      isSyncing: this.isSyncing,
      queueCount: queue.length,
    };
  }

  async queueSubmission(submission: ProblemSubmission): Promise<string> {
    const id = await offlineQueueService.addSubmission(submission);
    this.queueCount++;
    this.callbacks.onQueueChange?.(this.queueCount);
    return id;
  }

  async initialize(): Promise<void> {
    const queue = await offlineQueueService.getQueue();
    this.queueCount = queue.length;
    this.callbacks.onQueueChange?.(this.queueCount);

    if (queue.length > 0) {
      const online = await this.isOnline();
      if (online) {
        await this.sync();
      }
    }
  }
}

export const syncManager = new SyncManager();
