export type Problem = {
  id: string;
  name?: string;
  grade?: string;
  order?: number;
  colorStr: string;
  color: string;
  description?: string;
  line: number[][];
  topo?: string;
  subarea?: string;
  coordinates?: [number, number]; // [longitude, latitude]
};
