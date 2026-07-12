import { Feature, Point } from "geojson";
import { CirqueData, useDataStore } from "./dataStore";
import { useProblemStore } from "./problemStore";

const feature = (
  properties: Record<string, unknown>,
  coordinates: [number, number]
): Feature<Point> => ({
  type: "Feature",
  properties,
  geometry: { type: "Point", coordinates },
});

const problems = [
  feature(
    { id: "one", name: "One", grade: "V2", subarea: "Wall", color: "blue", order: 1 },
    [1, 1]
  ),
  feature(
    { id: "two", name: "Two", grade: "V5", subarea: "Wall", color: "blue", order: 2 },
    [2, 2]
  ),
  feature(
    { id: "three", name: "Three", grade: "V3", subarea: "Wall", color: "blue", order: 3 },
    [3, 3]
  ),
  feature(
    { id: "other", name: "Other", grade: "V4", subarea: "Elsewhere", color: "red", order: 1 },
    [4, 4]
  ),
];

const fixture: CirqueData = {
  problems: { type: "FeatureCollection", features: problems },
  areas: { type: "FeatureCollection", features: [] },
  boulders: { type: "FeatureCollection", features: [] },
  subareaPolygons: { type: "FeatureCollection", features: [] },
  subareaCenters: { type: "FeatureCollection", features: [] },
};

describe("useProblemStore", () => {
  beforeEach(() => {
    useDataStore.getState().setData(fixture, null);
    useProblemStore.setState({ problem: null, viewProblem: false, minGrade: 0, maxGrade: 10 });
  });

  it("returns ordered, grade-filtered problems from only the requested circuit", () => {
    const store = useProblemStore.getState();
    expect(store.getVisibleProblemsInCircuit("blue", "Wall").map(problem => problem.id)).toEqual([
      "one",
      "two",
      "three",
    ]);
    store.setMinGrade(3);
    store.setMaxGrade(5);
    expect(
      useProblemStore
        .getState()
        .getVisibleProblemsInCircuit("blue", "Wall")
        .map(problem => problem.id)
    ).toEqual(["two", "three"]);
  });

  it("clamps navigation at the ends and skips hidden grades", () => {
    const store = useProblemStore.getState();
    const one = store.getProblem({ circuitColor: "blue", subarea: "Wall", order: 1 })!;
    const three = store.getProblem({ circuitColor: "blue", subarea: "Wall", order: 3 })!;
    store.setProblem(one);
    store.showPreviousProblem();
    expect(useProblemStore.getState().problem?.id).toBe("one");
    store.showNextProblem();
    expect(useProblemStore.getState().problem?.id).toBe("two");
    store.setProblem(three);
    store.showNextProblem();
    expect(useProblemStore.getState().problem?.id).toBe("three");
    store.showPreviousProblem();
    expect(useProblemStore.getState().problem?.id).toBe("two");

    store.setMinGrade(2);
    store.setMaxGrade(3);
    store.setProblem(one);
    store.showNextProblem();
    expect(useProblemStore.getState().problem?.id).toBe("three");
    useProblemStore.getState().showPreviousProblem();
    expect(useProblemStore.getState().problem?.id).toBe("one");
  });

  it("finds a problem by circuit, subarea, and order", () => {
    const store = useProblemStore.getState();
    expect(store.getProblem({ circuitColor: "blue", subarea: "Wall", order: 2 })?.id).toBe("two");
    expect(store.getProblem({ circuitColor: "blue", subarea: "Wall", order: 99 })).toBeNull();
  });

  it("materializes valid map features and rejects incomplete ones", () => {
    const store = useProblemStore.getState();
    expect(store.createProblemFromMapFeature(problems[0])).toMatchObject({
      name: "One",
      grade: "V2",
      subarea: "Wall",
      order: 1,
      coordinates: [1, 1],
      color: "#3B82F6",
    });
    expect(
      store.createProblemFromMapFeature(feature({ name: "Missing fields" }, [0, 0]))
    ).toBeNull();
  });

  it("creates a circuit line in problem order", () => {
    const store = useProblemStore.getState();
    store.setProblem(store.getProblem({ circuitColor: "blue", subarea: "Wall", order: 1 }));
    expect(useProblemStore.getState().getCircuitLine()?.features[0].geometry.coordinates).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });
});
