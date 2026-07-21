import { MAX_GRADE, MIN_GRADE, Problem } from "@/models/problems";

export type SearchResult = {
  problem: Problem;
  matchType: "name" | "grade" | "subarea";
};

type GradeRange = {
  minGrade: number;
  maxGrade: number;
};

/** Ranks the current, already-materialized problems for the search overlay. */
export function searchProblems(
  problems: Problem[],
  query: string,
  { minGrade, maxGrade }: GradeRange
): SearchResult[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  const results: SearchResult[] = [];
  for (const problem of problems) {
    if (minGrade > MIN_GRADE || maxGrade < MAX_GRADE) {
      if (!problem.grade) continue;

      const problemGradeNum = parseInt(problem.grade.replace("V", ""), 10);
      if (problemGradeNum < minGrade || problemGradeNum > maxGrade) continue;
    }

    if (problem.name?.toLowerCase().includes(searchTerm)) {
      results.push({ problem, matchType: "name" });
    } else if (problem.grade?.toLowerCase().includes(searchTerm)) {
      results.push({ problem, matchType: "grade" });
    } else if (problem.subarea?.toLowerCase().includes(searchTerm)) {
      results.push({ problem, matchType: "subarea" });
    }
  }

  const order = { name: 0, grade: 1, subarea: 2 };
  return results.sort((a, b) => order[a.matchType] - order[b.matchType]).slice(0, 50);
}
