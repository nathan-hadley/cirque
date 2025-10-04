import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoSubscription } from "@react-native-community/netinfo";

import type { ProblemSubmission, QueueItem } from "@/models/contribute";

const STORAGE_KEY = "contribute_queue_v1";

type QueueProcessor = (submission: ProblemSubmission) => Promise<number | void>;

class OfflineQueueService {
	private isProcessing: boolean = false;
	private networkSub: NetInfoSubscription | null = null;
	private processor: QueueProcessor | null = null;

	async loadQueue(): Promise<QueueItem[]> {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		try {
			const parsed: QueueItem[] = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	private async saveQueue(items: QueueItem[]): Promise<void> {
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}

	async enqueue(submission: ProblemSubmission): Promise<string> {
		const items = await this.loadQueue();
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const now = Date.now();
		const item: QueueItem = {
			id,
			data: submission,
			attempts: 0,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		};
		items.push(item);
		await this.saveQueue(items);
		return id;
	}

	async remove(id: string): Promise<void> {
		const items = await this.loadQueue();
		const next = items.filter((it) => it.id !== id);
		await this.saveQueue(next);
	}

	async update(id: string, update: Partial<QueueItem>): Promise<void> {
		const items = await this.loadQueue();
		const idx = items.findIndex((it) => it.id === id);
		if (idx === -1) return;
		items[idx] = { ...items[idx], ...update, updatedAt: Date.now() } as QueueItem;
		await this.saveQueue(items);
	}

	async processQueue(process?: QueueProcessor, maxRetries: number = 2): Promise<void> {
		if (this.isProcessing) return;
		this.isProcessing = true;
		try {
			const items = await this.loadQueue();
			const processor = process ?? this.processor;
			if (!processor) return;
			for (const item of items) {
				if (item.status === "done") continue;
				try {
					await this.update(item.id, { status: "processing" });
					await processor(item.data);
					await this.remove(item.id);
				} catch (err) {
					const nextAttempts = item.attempts + 1;
					const message = err instanceof Error ? err.message : String(err);
					if (nextAttempts > maxRetries) {
						await this.update(item.id, { status: "failed", attempts: nextAttempts, lastError: message });
					} else {
						await this.update(item.id, { status: "pending", attempts: nextAttempts, lastError: message });
					}
				}
			}
		} finally {
			this.isProcessing = false;
		}
	}

	startNetworkObserver(process: QueueProcessor): void {
		this.processor = process;
		if (this.networkSub) return;
		this.networkSub = NetInfo.addEventListener((state) => {
			const online = Boolean(state.isConnected && state.isInternetReachable !== false);
			if (online) {
				// Fire and forget; internal guard prevents concurrent runs
				this.processQueue().catch(() => {});
			}
		});
	}

	stopNetworkObserver(): void {
		if (this.networkSub) {
			this.networkSub();
			this.networkSub = null;
		}
	}
}

export const offlineQueueService = new OfflineQueueService();

