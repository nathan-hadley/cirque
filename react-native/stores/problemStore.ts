import { create } from "zustand";
import { Feature, FeatureCollection, GeoJsonProperties, Point, LineString } from "geojson";
import { Alert } from "react-native";
import { problemsData } from "@/assets/problems";
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
  getVisibleProblemsInCircuit: (circuitColor: string, subarea: string) => Problem[];
  getCircuitLine: () => FeatureCollection<LineString, GeoJsonProperties> | null;
};

export const useProblemStore = create<ProblemState>((set, get) => {
  // Internal helper methods
  const getAllProblemsInCircuit = (circuitColor: string, subarea: string): Problem[] => {
    if (!problemsData) return [];

    return problemsData.features
      .filter(feature => {
        const props = feature.properties;
        return (
          props?.color === circuitColor &&
          props?.subarea === subarea &&
          typeof props.order !== "undefined"
        );
      })
      .map(feature => get().createProblemFromMapFeature(feature))
      .filter((problem): problem is Problem => problem !== null)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const generateCircuitLineFromProblems = (
    problems: Problem[],
    circuitColor: string,
    subarea: string
  ): FeatureCollection<LineString, GeoJsonProperties> | null => {
    if (problems.length < 2) return null; // Need at least 2 points to make a line

    // Extract coordinates from problems, ensuring they're sorted by order
    const coordinates = problems
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(problem => problem.coordinates)
      .filter((coord): coord is [number, number] => coord !== undefined && coord.length >= 2);

    if (coordinates.length < 2) return null;

    // Create LineString feature
    const lineFeature: Feature<LineString, GeoJsonProperties> = {
      type: "Feature",
      properties: {
        color: circuitColor,
        subarea,
      },
      geometry: {
        type: "LineString",
        coordinates,
      },
    };

    return {
      type: "FeatureCollection",
      features: [lineFeature],
    };
  };

  return {
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
      const { problem, getVisibleProblemsInCircuit, setProblem } = get();
      if (!problem || !problem.subarea) return;

      // Get all visible problems in the current circuit
      const visibleProblems = getVisibleProblemsInCircuit(problem.colorStr, problem.subarea);
      if (visibleProblems.length === 0) return;

      // Find current problem index in visible problems
      const currentIndex = visibleProblems.findIndex(p => p.order === problem.order);
      if (currentIndex <= 0) return; // Already at first visible problem or not found

      // Navigate to previous visible problem
      const previousProblem = visibleProblems[currentIndex - 1];
      setProblem(previousProblem);
      set({ viewProblem: true });
    },

    showNextProblem: () => {
      const { problem, getVisibleProblemsInCircuit, setProblem } = get();
      if (!problem || !problem.subarea) return;

      // Get all visible problems in the current circuit
      const visibleProblems = getVisibleProblemsInCircuit(problem.colorStr, problem.subarea);
      if (visibleProblems.length === 0) return;

      // Find current problem index in visible problems
      const currentIndex = visibleProblems.findIndex(p => p.order === problem.order);
      if (currentIndex === -1 || currentIndex >= visibleProblems.length - 1) return; // Not found or at last visible problem

      // Navigate to next visible problem
      const nextProblem = visibleProblems[currentIndex + 1];
      setProblem(nextProblem);
      set({ viewProblem: true });
    },

    navigateToFirstProblem: (circuitColor: string, subarea: string) => {
      const { getVisibleProblemsInCircuit, setProblem } = get();
      const visibleProblems = getVisibleProblemsInCircuit(circuitColor, subarea);

      if (visibleProblems.length > 0) {
        // Navigate to first visible problem in circuit
        setProblem(visibleProblems[0]);
        set({ viewProblem: true });
      } else {
        Alert.alert("Error", "Could not find any visible problems in this circuit.");
      }
    },

    getVisibleProblemsInCircuit: (circuitColor: string, subarea: string): Problem[] => {
      const { selectedGrades } = get();

      // Get all problems in the circuit
      const allProblems = getAllProblemsInCircuit(circuitColor, subarea);

      // If no grades are selected, return all problems
      if (selectedGrades.length === 0) {
        return allProblems;
      }

      // Filter by selected grades (already sorted by getAllProblemsInCircuit)
      return allProblems.filter(problem => problem.grade && selectedGrades.includes(problem.grade));
    },

    createProblemFromMapFeature: (feature: Feature<Point, GeoJsonProperties>): Problem | null => {
      const properties = feature.properties || {};
      const name = properties.name?.toString();
      const topo = properties.topo?.toString();
      const subarea = properties.subarea?.toString();
      const grade = properties.grade?.toString();

      // TODO: we need a way to identify problems vs other map features
      // Name, subarea, and grade should be unique to problems
      if (!name || !subarea || !grade) return null;

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
        subarea,
        coordinates,
      };
    },

    getCircuitLine: (): FeatureCollection<LineString, GeoJsonProperties> | null => {
      const { problem, getVisibleProblemsInCircuit, selectedGrades } = get();
      if (!problem || !problem.colorStr || !problem.subarea) return null;

      // Get problems based on whether grades are filtered
      const problems =
        selectedGrades.length === 0
          ? getAllProblemsInCircuit(problem.colorStr, problem.subarea) // All problems when no filter
          : getVisibleProblemsInCircuit(problem.colorStr, problem.subarea); // Filtered problems

      return generateCircuitLineFromProblems(problems, problem.colorStr, problem.subarea);
    },
  };
});

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
