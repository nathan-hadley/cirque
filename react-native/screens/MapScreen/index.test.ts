import { TransformCaller, transformFileSync } from "@babel/core";

// This project has no @types/node; Jest provides __dirname at runtime.
declare const __dirname: string;

/**
 * Regression test: the circuit line must re-derive when the selected problem changes.
 *
 * MapScreen derives the circuit line during render, and `app.config.ts` enables
 * `experiments.reactCompiler`. React Compiler memoizes render-time derivations and infers
 * their dependencies from the values the expression actually reads. A zero-argument zustand
 * action (`getCircuitLine()`) reads nothing reactive: its only inferred dependency is the
 * action itself, whose identity never changes. The compiler therefore caches the value from
 * the first render -- `null`, because no problem is selected at mount -- and reuses it
 * forever, so the dashed circuit line never appears.
 *
 * The derivation must instead be a pure function of the reactive state it depends on, so the
 * compiler can see that state and invalidate its cache. Jest does not run React Compiler, so
 * this asserts against the compiled output, which is where the bug lives.
 */

const projectRoot = `${__dirname}/../..`;

function compileMapScreenWithReactCompiler(): string {
  const filename = `${projectRoot}/screens/MapScreen/index.tsx`;

  const result = transformFileSync(filename, {
    root: projectRoot,
    cwd: projectRoot,
    filename,
    babelrc: false,
    configFile: `${projectRoot}/babel.config.js`,
    // TransformCaller only types Babel's own keys; the rest are babel-preset-expo's.
    caller: {
      name: "metro",
      platform: "ios",
      engine: "hermes",
      isDev: false,
      isServer: false,
      isNodeModule: false,
      supportsStaticESM: true,
      // Mirrors app.config.ts -> experiments.reactCompiler
      supportsReactCompiler: true,
    } as TransformCaller,
  });

  return (result?.code ?? "").replace(/\s+/g, "");
}

/**
 * Follows the value handed to <CircuitLineLayer circuitLine={...} /> back to the React
 * Compiler memo block that produces it, and returns that block's cache-invalidation condition.
 */
function circuitLineMemoGuard(code: string): string {
  expect(code).toContain("react/compiler-runtime"); // guards against the compiler silently not running

  const prop = code.match(/circuitLine:(\w+)/);
  if (!prop) throw new Error("Could not find the circuitLine prop in the compiled MapScreen");

  // The compiler assigns memoized values to temporaries, e.g. `var currentCircuitLine = t0;`
  let name = prop[1];
  const alias = code.match(new RegExp(`var${name}=(\\w+);`));
  if (alias) name = alias[1];

  const guard = code.match(new RegExp(`if\\(([^)]*?)\\)\\{${name}=`));
  if (!guard) throw new Error(`Could not find the memo block that computes ${name}`);

  return guard[1];
}

describe("MapScreen circuit line derivation under React Compiler", () => {
  const guard = circuitLineMemoGuard(compileMapScreenWithReactCompiler());

  it("recomputes when the selected problem changes", () => {
    expect(guard).toMatch(/\bproblem\b/);
  });

  it("recomputes when the grade filter changes", () => {
    expect(guard).toMatch(/\bminGrade\b/);
    expect(guard).toMatch(/\bmaxGrade\b/);
  });

  it("recomputes when the problem data changes", () => {
    expect(guard).toMatch(/\bproblemsData\b/);
  });
});
