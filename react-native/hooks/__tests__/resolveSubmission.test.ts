import * as Network from "expo-network";
import axios from "axios";
import { submitProblem } from "@/api/problems";
import { syncManager } from "@/services/sync/syncManager";
import { ProblemSubmission } from "@/types/problemSubmission";
import { QUEUED_MESSAGE, resolveSubmission, SUBMITTED_MESSAGE } from "../useSubmitProblem";

jest.mock("expo-network", () => ({ getNetworkStateAsync: jest.fn() }));
jest.mock("@/api/problems", () => ({ submitProblem: jest.fn() }));
jest.mock("@/services/sync/syncManager", () => ({
  syncManager: { queueSubmission: jest.fn(), sync: jest.fn() },
}));

const submission: ProblemSubmission = {
  id: "submission-1",
  contact: { name: "A", email: "a@example.com" },
  problem: {
    name: "Problem",
    grade: "V3",
    subarea: "Area",
    description: "Desc",
    lat: 1,
    lng: 2,
    line: [],
  },
};
const mockNetwork = Network.getNetworkStateAsync as jest.Mock;
const mockSubmit = submitProblem as jest.Mock;
const mockQueue = syncManager.queueSubmission as jest.Mock;
const mockSync = syncManager.sync as jest.Mock;

describe("resolveSubmission", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits online submissions immediately", async () => {
    mockNetwork.mockResolvedValue({ isInternetReachable: true });
    mockSubmit.mockResolvedValue({ success: true });

    await expect(resolveSubmission(submission)).resolves.toEqual({
      success: true,
      queued: false,
      message: SUBMITTED_MESSAGE,
    });
    expect(mockQueue).not.toHaveBeenCalled();
  });

  it("queues when offline without attempting a request", async () => {
    mockNetwork.mockResolvedValue({ isInternetReachable: false });

    await expect(resolveSubmission(submission)).resolves.toEqual({
      success: true,
      queued: true,
      message: QUEUED_MESSAGE,
    });
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockQueue).toHaveBeenCalledWith(submission);
  });

  it("queues Axios network errors", async () => {
    const networkError = new axios.AxiosError("Network Error");
    mockNetwork.mockResolvedValue({ isInternetReachable: true });
    mockSubmit.mockRejectedValue(networkError);

    await expect(resolveSubmission(submission)).resolves.toMatchObject({
      queued: true,
      message: QUEUED_MESSAGE,
    });
    expect(mockQueue).toHaveBeenCalledWith(submission);
    expect(mockSync).toHaveBeenCalled();
  });

  it("rethrows non-network submission errors", async () => {
    const error = new Error("API key is not set");
    mockNetwork.mockResolvedValue({ isInternetReachable: true });
    mockSubmit.mockRejectedValue(error);

    await expect(resolveSubmission(submission)).rejects.toBe(error);
    expect(mockQueue).not.toHaveBeenCalled();
  });
});
