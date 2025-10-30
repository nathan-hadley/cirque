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
  subarea?: string;
  coordinates?: [number, number]; // [longitude, latitude]
};

export const MIN_GRADE = 0;
export const MAX_GRADE = 10;

export const GRADES = Array.from({ length: 18 }, (_, i) => `V${i}`);
