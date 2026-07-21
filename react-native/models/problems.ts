export type ProblemStatus = "pending" | "approved" | "rejected";

export type Problem = {
  id: string;
  name?: string;
  grade?: string;
  order?: number;
  colorStr: string;
  color: string;
  description?: string;
  line: [number, number][]; // Array of [x, y] coordinate tuples
  topo?: string;
  topoKey?: string;
  status?: ProblemStatus; // 'pending' renders a review badge
  subarea?: string;
  coordinates?: [number, number]; // [longitude, latitude]
};

export const MIN_GRADE = 0;
export const GRADES = Array.from({ length: 18 }, (_, i) => `V${i}`);
export const MAX_GRADE = GRADES.length - 1;
