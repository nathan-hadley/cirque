const { defineConfig } = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  ...compat.extends("expo"),
  {
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
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
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "import/no-unresolved": "off",
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
      "no-debugger": "error",
      "no-alert": "error",
      "no-undef": "error",
      "no-irregular-whitespace": "error",
      "no-multiple-empty-lines": [
        "error",
        {
          max: 2,
          maxEOF: 1,
        },
      ],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
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
  },
  {
    ignores: ["dist/*", "components/ui/**/*"],
  },
]);
