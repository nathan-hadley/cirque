import { create } from "zustand";
import { Feature, FeatureCollection, GeoJsonProperties, Point, LineString } from "geojson";
import { Alert } from "react-native";
import { problemsData } from "@/assets/problems";
import { circuitsData } from "@/assets/circuits";
import { Problem } from "@/models/problems";

type GetProblemParams = {
  circuitColor: string;
  subarea: string;
  order: number;
};

type ProblemState = {
  // State
  problem: Problem | null;
  viewProblem: boolean;
  selectedGrades: string[];

  // Actions
  setProblem: (problem: Problem | null) => void;
  setViewProblem: (view: boolean) => void;
  setSelectedGrades: (grades: string[]) => void;
  toggleGrade: (grade: string) => void;
  getProblem: (params: GetProblemParams) => Problem | null;
  showPreviousProblem: () => void;
  showNextProblem: () => void;
  navigateToFirstProblem: (circuitColor: string, subarea: string) => void;
  createProblemFromMapFeature: (feature: Feature<Point, GeoJsonProperties>) => Problem | null;
  getCurrentCircuitLine: () => FeatureCollection<LineString, GeoJsonProperties> | null;
};

export const useProblemStore = create<ProblemState>((set, get) => ({
  // Initial state
  problem: null,
  viewProblem: false,
  selectedGrades: [],

  // Actions
  setProblem: (problem: Problem | null) => set({ problem }),
  setViewProblem: (view: boolean) => set({ viewProblem: view }),
  setSelectedGrades: (grades: string[]) => set({ selectedGrades: grades }),
  toggleGrade: (grade: string) => {
    const { selectedGrades } = get();
    const newGrades = selectedGrades.includes(grade)
      ? selectedGrades.filter(g => g !== grade)
      : [...selectedGrades, grade];
    set({ selectedGrades: newGrades });
  },

  getProblem: (params: GetProblemParams): Problem | null => {
    const { createProblemFromMapFeature } = get();
    if (!problemsData) return null;

    const feature =
      problemsData.features.find((feature: Feature<Point, GeoJsonProperties>) => {
        const props = feature.properties;
        return (
          props?.color === params.circuitColor &&
          props?.subarea === params.subarea &&
          (props?.order === params.order || props?.order === params.order.toString())
        );
      }) || null;

    return feature ? createProblemFromMapFeature(feature) : null;
  },

  showPreviousProblem: () => {
    const { problem, getProblem, setProblem } = get();
    if (!problem || problem.order === undefined) return;

    const newProblemOrder = (problem.order || 0) - 1;
    const newProblem = getProblem({
      circuitColor: problem.colorStr,
      subarea: problem.subarea || "",
      order: newProblemOrder,
    });
    if (newProblem) {
      setProblem(newProblem);
      set({ viewProblem: true });
    }
  },

  showNextProblem: () => {
    const { problem, getProblem, setProblem } = get();
    if (!problem || problem.order === undefined) return;

    const newProblemOrder = (problem.order || 0) + 1;
    const newProblem = getProblem({
      circuitColor: problem.colorStr,
      subarea: problem.subarea || "",
      order: newProblemOrder,
    });
    if (newProblem) {
      setProblem(newProblem);
      set({ viewProblem: true });
    }
  },

  navigateToFirstProblem: (circuitColor: string, subarea: string) => {
    const { getProblem, setProblem } = get();
    const problem = getProblem({
      circuitColor,
      subarea,
      order: 1,
    });

    if (problem) {
      setProblem(problem);
      set({ viewProblem: true });
    } else {
      Alert.alert("Error", "Could not find the first problem in this circuit.");
    }
  },

  createProblemFromMapFeature: (feature: Feature<Point, GeoJsonProperties>): Problem | null => {
    const properties = feature.properties || {};
    const name = properties.name?.toString();
    const topo = properties.topo?.toString();

    if (!name || !topo) return null;

    const coordinates = feature.geometry?.coordinates?.slice(0, 2) as [number, number];

    const order =
      typeof properties.order === "number"
        ? properties.order
        : properties.order
          ? parseInt(properties.order.toString(), 10)
          : undefined;

    let line: number[][] = [];
    try {
      if (properties.line && typeof properties.line === "string") {
        line = JSON.parse(properties.line);
      }
    } catch (error) {
      console.error("Failed to parse topo line coordinates:", error);
    }

    return {
      id: properties.id?.toString() || Date.now().toString(),
      name,
      grade: properties.grade?.toString(),
      order,
      colorStr: properties.color?.toString() || "",
      color: getColorFromString(properties.color?.toString()),
      description: properties.description?.toString(),
      line,
      topo,
      subarea: properties.subarea?.toString(),
      coordinates,
    };
  },

  getCurrentCircuitLine: (): FeatureCollection<LineString, GeoJsonProperties> | null => {
    const { problem } = get();
    if (!problem || !problem.colorStr || !problem.subarea || !circuitsData) return null;

    const currentCircuit = circuitsData.features.find(
      feature =>
        feature.properties?.color === problem.colorStr &&
        feature.properties?.subarea === problem.subarea
    );

    return currentCircuit
      ? {
          type: "FeatureCollection" as const,
          features: [currentCircuit],
        }
      : null;
  },
}));

function getColorFromString(colorString?: string): string {
  switch (colorString) {
    case "blue":
      return "#3B82F6";
    case "white":
      return "#FFFFFF";
    case "red":
      return "#EF4444";
    case "orange":
      return "#F97316";
    case "yellow":
      return "#FACC15";
    case "black":
      return "#000000";
    default:
      return "#000000";
  }
}
