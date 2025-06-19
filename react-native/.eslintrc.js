// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['/dist/*', 'components/ui/**/*'],
  rules: {
    // Disallow any types
    '@typescript-eslint/no-explicit-any': 'error',
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      excludedFiles: ['components/ui/**/*'],
      rules: {
        // TypeScript-specific rules for .ts and .tsx files
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
};
