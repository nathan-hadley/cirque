import type { ProblemSubmission } from "@cirque-api/types";
import { API_ENDPOINTS, API_KEY } from "@/constants/api";

export type SubmitProblemResponse = {
  success: boolean;
  error?: string;
};

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
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
