import type { ProblemSubmission } from "@cirque-api/types";
import { useMutation } from "@tanstack/react-query";
import { submitProblem } from "@/api/problems";

export function useSubmitProblem() {
  return useMutation({
    mutationFn: (submission: ProblemSubmission) => submitProblem(submission),
  });
}
