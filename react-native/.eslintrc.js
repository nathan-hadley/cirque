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
