// Map constants
export const INITIAL_ZOOM = 10.5;
export const USER_LOCATION_ZOOM = 16; // Zoom level when centering to user location
export const PROBLEM_ZOOM = 19; // Zoom level when flying to a problem
export const INITIAL_CENTER = [-120.713, 47.585]; // Note: [longitude, latitude] in React Native
export const STYLE_URI = "mapbox://styles/mapbox/outdoors-v12";
export const PROBLEMS_LAYER = "leavenworth-problems";
export const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoibmF0aGFuaGFkbGV5IiwiYSI6ImNsdzdmdXAxdDIycmoyanA3cXVvbHFxenQifQ.1wcBxvOkH8eU-6ev7SoO8Q";

// Offline maps constants
export const TILEPACK_ID = "Leavenworth";
export const BBOX_COORDS = [
  [-120.94, 47.51],
  [-120.94, 47.75],
  [-120.58, 47.75],
  [-120.58, 47.51],
];

// Color constants
export const PROBLEM_COLORS = {
  red: "#ff0000",
  blue: "#0000ff",
  black: "#000000",
  white: "#ffffff",
  green: "#00ff00",
  yellow: "#ffff00",
  default: "#888888", // grey
  blackText: "#000000", // black text for white circles
  defaultText: "#ffffff", // white text for all other circles
} as const;

export const SELECTED_PROBLEM_COLORS = {
  stroke: "#22c55e", // green-500
} as const;

export const BOULDER_COLORS = {
  fill: "#B0B0B0", // light grey fill
  line: "#A0A0A0", // lighter grey line
} as const;

export const SUBAREA_COLORS = {
  fill: "#808080", // grey fill
} as const;

// Layer IDs
export const LAYER_IDS = {
  problems: "problems-layer",
  problemsText: "problems-text-layer",
  circuitLine: "circuit-line-layer",
  bouldersFill: "boulders-fill-layer",
  boulders: "boulders-layer",
  selectedProblem: "selected-problem-indicator",
  subareaFill: "subarea-fill-layer",
  subareaLabels: "subarea-labels-layer",
  areaLabels: "area-labels-layer",
} as const;

// Source IDs
export const SOURCE_IDS = {
  problems: "problems-source",
  circuitLine: "circuit-line-source",
  boulders: "boulders-source",
  selectedProblem: "selected-problem-source",
  subareas: "subareas-source",
  subareaLabels: "subarea-labels-source",
  areaLabels: "area-labels-source",
} as const;
