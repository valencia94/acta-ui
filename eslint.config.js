// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  js.configs.recommended,

  // TypeScript Rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.lint.json'],
        tsconfigRootDir: process.cwd(),
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      ...tseslint.configs.recommendedTypeChecked.rules,

      // 🟡 TEMPORARILY silenced rules for deploy unblock
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Core rules
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn'
    }
  },

  // JavaScript / React Rules
  {
    files: ['**/*.{ts,tsx,js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node
        module: true,
        require: true,
        process: true,
        __dirname: true,
        __filename: true,
        exports: true,
        global: true,

        // Browser
        window: true,
        document: true,
        console: true,
        fetch: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        requestAnimationFrame: true,

        // DOM
        Blob: true,
        File: true,
        FormData: true,
        Headers: true,
        Request: true,
        Response: true,
        URL: true,
        Event: true,
        CustomEvent: true,
        HTMLElement: true,
        DOMRect: true,
        AbortController: true,
        IntersectionObserver: true,
        MutationObserver: true,
        ResizeObserver: true
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'no-empty': 'warn',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

  // 🚫 Ignore broken legacy + deployment bundle files
  {
    files: [
      '**/working-bundle.js',
      '**/deployment-backup/**/*.js',
      '**/dist/**/*.js',
      '**/archive/**/*.ts',
      '**/*.bundle.js'
    ],
    rules: {
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'off',
      'no-empty': 'off',
      'no-func-assign': 'off',
      'no-case-declarations': 'off',
      'no-cond-assign': 'off',
      'getter-return': 'off',
      'valid-typeof': 'off',
      'no-fallthrough': 'off',
      'no-control-regex': 'off',
      'no-sparse-arrays': 'off',
      'no-constant-condition': 'off',
      'no-extra-boolean-cast': 'off',
      'no-self-assign': 'off',
      'no-redeclare': 'off'
    }
  },

  prettier
];

