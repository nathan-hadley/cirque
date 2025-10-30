import type { ProblemSubmission } from "@cirque-api/types";
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

  const response = await fetch(API_ENDPOINTS.submitProblem, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorResponse: SubmitProblemErrorResponse = {
      success: false,
      error: errorData.error || `Server error: ${response.status}`,
    };
    throw new Error(errorResponse.error);
  }

  const data = await response.json();
  return data as SubmitProblemResponse;
}
