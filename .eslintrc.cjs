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
    'scripts/',
    'tests/',
  ],
  rules: {
    // Import hygiene
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'unused-imports/no-unused-imports': 'error',

    // Console control
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],

    'react/react-in-jsx-scope': 'off',

    // Optional polish
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-empty': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react/no-unescaped-entities': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
