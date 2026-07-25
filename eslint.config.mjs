/**
 * @fileoverview ESLint configuration for Seoul Fit Frontend
 * @description Comprehensive ESLint setup for open-source TypeScript React project
 * @author Seoul Fit Team
 * @version 2.0.0
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * ESLint Configuration for Seoul Fit Frontend
 *
 * Features:
 * - Strict TypeScript rules for type safety
 * - React best practices and hooks rules
 * - Next.js optimizations
 * - Import organization and unused variable detection
 * - Code style consistency
 */
const eslintConfig = [
  // Base Next.js configurations (includes TypeScript support)
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Enhanced rules for open-source quality
  {
    rules: {
      // Basic TypeScript rules (no type checking required)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React specific rules
      'react/jsx-key': 'error',
      'react/self-closing-comp': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General JavaScript rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',

      // Code quality rules
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 20],

      // Security rules
      'no-eval': 'error',
      'no-script-url': 'error',
    },
  },

  // File-specific overrides
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // Relax some rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-script-url': 'off',
    },
  },

  {
    files: [
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
    ],
    rules: {
      // Relax some rules for config files
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.storybook/build/**',
      'storybook-static/**',
      '*.min.js',
      '*.bundle.js',
    ],
  },
];

export default eslintConfig;
