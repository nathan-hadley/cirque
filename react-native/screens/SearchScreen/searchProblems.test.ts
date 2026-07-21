import { MAX_GRADE, Problem } from "@/models/problems";
import { searchProblems } from "./searchProblems";

const problem = (overrides: Partial<Problem>): Problem => ({
  id: overrides.id ?? "id",
  colorStr: "blue",
  color: "#3B82F6",
  line: [],
  ...overrides,
});

describe("searchProblems", () => {
  const problems = [
    problem({ id: "name", name: "Moon Walk", grade: "V1", subarea: "Cave" }),
    problem({ id: "grade", name: "Other", grade: "V5", subarea: "Forest" }),
    problem({ id: "subarea", name: "Third", grade: "V2", subarea: "Moon Zone" }),
  ];

  it("returns no results for empty, whitespace-only, or unmatched queries", () => {
    expect(searchProblems(problems, "", { minGrade: 0, maxGrade: MAX_GRADE })).toEqual([]);
    expect(searchProblems(problems, "  ", { minGrade: 0, maxGrade: MAX_GRADE })).toEqual([]);
    expect(searchProblems(problems, "missing", { minGrade: 0, maxGrade: MAX_GRADE })).toEqual([]);
  });

  it("matches case-insensitively by name, then grade, then subarea", () => {
    expect(searchProblems(problems, " moon ", { minGrade: 0, maxGrade: MAX_GRADE })).toEqual([
      { problem: problems[0], matchType: "name" },
      { problem: problems[2], matchType: "subarea" },
    ]);
    expect(searchProblems(problems, "v5", { minGrade: 0, maxGrade: MAX_GRADE })).toEqual([
      { problem: problems[1], matchType: "grade" },
    ]);
  });

  it("orders result categories and honors the active grade range", () => {
    const ranked = [
      problem({ id: "subarea", name: "One", grade: "V2", subarea: "target" }),
      problem({ id: "grade", name: "Two", grade: "V3 target", subarea: "Elsewhere" }),
      problem({ id: "name", name: "target Three", grade: "V4", subarea: "Elsewhere" }),
    ];
    expect(
      searchProblems(ranked, "TARGET", { minGrade: 0, maxGrade: MAX_GRADE }).map(r => r.matchType)
    ).toEqual(["name", "grade", "subarea"]);
    expect(
      searchProblems(problems, "o", { minGrade: 5, maxGrade: 5 }).map(r => r.problem.id)
    ).toEqual(["grade"]);
  });

  it("excludes gradeless problems when a grade filter is active", () => {
    const gradeless = problem({ id: "gradeless", name: "Moon Walk", subarea: "Cave" });

    expect(searchProblems([gradeless], "moon", { minGrade: 1, maxGrade: 5 })).toEqual([]);
  });

  it("keeps V11 problems visible when the upper end of the grade range is selected", () => {
    const v11 = problem({ id: "v11", name: "The Practitioner", grade: "V11" });

    expect(searchProblems([v11], "practitioner", { minGrade: 1, maxGrade: MAX_GRADE })).toEqual([
      { problem: v11, matchType: "name" },
    ]);
  });

  it("caps results at 50", () => {
    const many = Array.from({ length: 51 }, (_, i) => problem({ id: `${i}`, name: "match" }));
    expect(searchProblems(many, "match", { minGrade: 0, maxGrade: MAX_GRADE })).toHaveLength(50);
  });
});
