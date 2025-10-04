import AsyncStorage from "@react-native-async-storage/async-storage";
import { act } from "react-test-renderer";

import { useContributeStore } from "@/stores/contributeStore";
import type { ProblemSubmission } from "@/models/contribute";

jest.mock("@/services/offlineQueueService", () => {
	return {
		offlineQueueService: {
			enqueue: jest.fn().mockResolvedValue("id-1"),
			processQueue: jest.fn().mockResolvedValue(undefined),
			startNetworkObserver: jest.fn(),
		},
	};
});

const sample: ProblemSubmission = {
	submitterName: "T",
	submitterEmail: "t@t.com",
	problemName: "P",
	grade: "V1",
	subarea: "S",
	color: "red",
	order: 1,
	latitude: 0,
	longitude: 0,
	coordinates: [[0, 0], [1, 1]],
};

beforeEach(async () => {
	await AsyncStorage.clear();
});

describe("contributeStore", () => {
	it("enqueues submission and returns queued result", async () => {
		const enqueueSubmission = useContributeStore.getState().enqueueSubmission;
		const result = await enqueueSubmission(sample);
		expect(result.queued).toBe(true);
		expect(result.message).toBeTruthy();
	});

	it("processQueueNow delegates to offlineQueueService", async () => {
		const spy = require("@/services/offlineQueueService").offlineQueueService.processQueue as jest.Mock;
		await act(async () => {
			await useContributeStore.getState().processQueueNow();
		});
		expect(spy).toHaveBeenCalled();
	});
});

