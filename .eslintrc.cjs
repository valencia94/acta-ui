// .eslintrc.cjs
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'simple-import-sort',
    'unused-imports',
    'react',
    'react-hooks',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.cjs',
    '*.config.js',
    '*.config.cjs',
    '*.stories.tsx',
    'vite.config.ts',
    'vite.config.*.ts',
    'vitest.config.ts',
    'scripts/',
    'tests/',
  ],
  rules: {
    // Import hygiene
    'simple-import-sort/imports': 'off',
    'simple-import-sort/exports': 'off',
    'unused-imports/no-unused-imports': 'off',

    // Console control (allow logs in codebase)
    'no-console': 'off',
    'no-undef': 'off', // Handled by TS

    // Optional polish
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'prettier/prettier': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
