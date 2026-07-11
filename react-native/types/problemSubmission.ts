export const VALIDATION_CONSTRAINTS = {
  MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 300,
  LINE_MAX_POINTS: 10,
  LAT_MIN: -90,
  LAT_MAX: 90,
  LNG_MIN: -180,
  LNG_MAX: 180,
} as const;

export type ProblemSubmission = {
  id: string;
  contact: {
    name: string;
    email: string;
  };
  problem: {
    name: string;
    grade: string;
    subarea: string;
    color?: string;
    order?: number;
    description: string;
    lat: number;
    lng: number;
    line: [number, number][];
    topo?: string;
    imageBase64?: string;
  };
};
