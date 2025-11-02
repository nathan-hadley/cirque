import type { ProblemSubmission } from "@cirque-api/types";
import axios from "axios";
import { API_ENDPOINTS, API_KEY } from "@/constants/api";

export type SubmitProblemSuccessResponse = {
  success: true;
};

export type SubmitProblemErrorResponse = {
  success: false;
  error: string;
};

export type SubmitProblemResponse = SubmitProblemSuccessResponse | SubmitProblemErrorResponse;

export async function submitProblem(submission: ProblemSubmission): Promise<SubmitProblemResponse> {
  if (!API_KEY) {
    throw new Error("API key is not set");
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    };

    // Add idempotency key from submission if provided
    if (submission.id) {
      headers["Idempotency-Key"] = submission.id;
    }

    const { data } = await axios.post<SubmitProblemResponse>(
      API_ENDPOINTS.submitProblem,
      submission,
      {
        headers,
        timeout: 15000, // 15 seconds
      }
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // For network errors, rethrow AxiosError so callers can detect by type
      if (!error.response || error.code === "ERR_NETWORK") {
        throw error;
      }
      // For HTTP errors, surface a helpful message
      const status = error.response.status;
      const message = (error.response.data as any)?.error || `Server error: ${status}`;
      throw new Error(message);
    }
    throw error as Error;
  }
}
