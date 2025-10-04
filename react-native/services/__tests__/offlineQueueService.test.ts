import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import { offlineQueueService } from "@/services/offlineQueueService";
import type { ProblemSubmission } from "@/models/contribute";

// helper to emit connectivity changes from our jest setup mock
const emitNet = (NetInfo as any).__emit as (state: any) => void;

const baseSubmission: ProblemSubmission = {
	submitterName: "Tester",
	submitterEmail: "tester@example.com",
	problemName: "My Problem",
	grade: "V3",
	subarea: "Forestland",
	color: "blue",
	order: 1,
	latitude: 1,
	longitude: 2,
	coordinates: [[0, 0], [10, 10]],
};

beforeEach(async () => {
	jest.clearAllMocks();
	await AsyncStorage.clear();
});

describe("offlineQueueService", () => {
	it("enqueues and persists items", async () => {
		const id = await offlineQueueService.enqueue(baseSubmission);
		const stored = await AsyncStorage.getItem("contribute_queue_v1");
		expect(id).toBeTruthy();
		expect(stored).toContain(id);
	});

	it("processes queue when online and removes items on success", async () => {
		const id = await offlineQueueService.enqueue(baseSubmission);

		const processor = jest.fn().mockResolvedValue(undefined);
		offlineQueueService.startNetworkObserver(processor);

		emitNet({ isConnected: true, isInternetReachable: true });
		await new Promise((r) => setTimeout(r, 0));

		const stored = await AsyncStorage.getItem("contribute_queue_v1");
		expect(processor).toHaveBeenCalledTimes(1);
		expect(stored).not.toContain(id);
	});

	it("retries on failure and eventually marks failed", async () => {
		await offlineQueueService.enqueue(baseSubmission);
		const processor = jest.fn().mockRejectedValue(new Error("boom"));
		// Call processQueue directly to avoid race with network observer
		await offlineQueueService.processQueue(processor, 1);
		await offlineQueueService.processQueue(processor, 1);

		const raw = await AsyncStorage.getItem("contribute_queue_v1");
		const items = JSON.parse(raw ?? "[]");
		expect(items[0].status).toBe("failed");
		expect(items[0].attempts).toBeGreaterThanOrEqual(2);
	});
});

