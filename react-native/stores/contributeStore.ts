import { create } from "zustand";

import type { ProblemSubmission, SubmissionResult } from "@/models/contribute";
import { offlineQueueService } from "@/services/offlineQueueService";
import { GitHubService } from "@/services/githubService";

type ContributeState = {
	isProcessingQueue: boolean;
	lastError: string | null;
	startQueueProcessor: () => void;
	enqueueSubmission: (submission: ProblemSubmission) => Promise<SubmissionResult>;
	processQueueNow: () => Promise<void>;
};

export const useContributeStore = create<ContributeState>((set, get) => ({
	isProcessingQueue: false,
	lastError: null,
	startQueueProcessor: () => {
		const service = new GitHubService({ owner: "", repo: "" });
		offlineQueueService.startNetworkObserver(async (data) => {
			// Wire in real submission in later phase
			// For now, just throw to keep in queue until implemented
			void data; // avoid unused param warning
			void service; // placeholder until wired
			throw new Error("Submission service not implemented yet");
		});
	},
	enqueueSubmission: async (submission) => {
		try {
			await offlineQueueService.enqueue(submission);
			return { queued: true, message: "Saved for submission when online" };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			set({ lastError: message });
			return { queued: false, success: false, message };
		}
	},
	processQueueNow: async () => {
		const { isProcessingQueue } = get();
		if (isProcessingQueue) return;
		set({ isProcessingQueue: true });
		try {
			await offlineQueueService.processQueue();
		} finally {
			set({ isProcessingQueue: false });
		}
	},
}));

