import * as Network from "expo-network";
import type { ProblemSubmission } from "@cirque-api/types";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { submitProblem } from "@/api/problems";
import { syncManager } from "@/services/sync/syncManager";

const QUEUED_MESSAGE = "Problem saved - will submit when online";
const SUBMITTED_MESSAGE = "Problem submitted successfully - we'll review it shortly";

export type SubmissionResult = {
  success: boolean;
  queued: boolean;
  message: string;
};

export function useSubmitProblem() {
  return useMutation({
    mutationFn: async (submission: ProblemSubmission): Promise<SubmissionResult> => {
      // Check network status at execution time, not at hook initialization
      let isOnline = true;
      try {
        const networkState = await Network.getNetworkStateAsync();
        isOnline = networkState.isInternetReachable === true;
      } catch (error) {
        console.error("Network connectivity check failed:", error);
        isOnline = false;
      }

      // If offline, queue the submission (idempotency key already in submission)
      if (!isOnline) {
        await syncManager.queueSubmission(submission);
        return {
          success: true,
          queued: true,
          message: QUEUED_MESSAGE,
        };
      }

      // If online, try to submit immediately (idempotency key already in submission)
      try {
        await submitProblem(submission);
        return {
          success: true,
          queued: false,
          message: SUBMITTED_MESSAGE,
        };
      } catch (error) {
        // If it's a network error (AxiosError with no response/ERR_NETWORK), queue it
        if (axios.isAxiosError(error) && (!error.response || error.code === "ERR_NETWORK")) {
          await syncManager.queueSubmission(submission);
          // Trigger sync when network comes back
          syncManager.sync();
          return {
            success: true,
            queued: true,
            message: QUEUED_MESSAGE,
          };
        }

        // Re-throw non-network errors
        throw error;
      }
    },
  });
}
