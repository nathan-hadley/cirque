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
      let isOnline = true;
      try {
        const networkState = await Network.getNetworkStateAsync();
        isOnline = networkState.isInternetReachable === true;
      } catch (error) {
        console.error("Network connectivity check failed:", error);
        isOnline = false;
      }

      if (!isOnline) {
        await syncManager.queueSubmission(submission);
        return {
          success: true,
          queued: true,
          message: QUEUED_MESSAGE,
        };
      }

      try {
        await submitProblem(submission);
        return {
          success: true,
          queued: false,
          message: SUBMITTED_MESSAGE,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && (!error.response || error.code === "ERR_NETWORK")) {
          await syncManager.queueSubmission(submission);
          syncManager.sync();
          return {
            success: true,
            queued: true,
            message: QUEUED_MESSAGE,
          };
        }

        throw error;
      }
    },
  });
}
