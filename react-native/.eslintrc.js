// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: "expo",
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["/dist/*", "components/ui/**/*"],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  rules: {
    // Disallow any types
    "@typescript-eslint/no-explicit-any": "error",
    // Make unused imports an error
    "@typescript-eslint/no-unused-vars": "error",
    // Prefer type over interface
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    // Disable import/no-unresolved for now as it's conflicting with TypeScript resolution
    "import/no-unresolved": "off",

    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "error",
    "no-undef": "error",

    // Prevent merge conflicts from being committed
    "no-irregular-whitespace": "error",
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],

    // Code consistency
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-template": "error",

    // Security guardrails
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",

    // Catch merge conflicts in lint step
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/^<{7}|^={7}|^>{7}/]",
        message: "Merge conflict marker detected. Resolve conflicts before committing.",
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      excludedFiles: ["components/ui/**/*"],
      rules: {
        // TypeScript-specific rules for .ts and .tsx files
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      },
    },
  ],
};
