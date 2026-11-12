import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'out/**',
      'dist/**',
      'release/**',
      'coverage/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // Project rules (CLAUDE.md section 8): no widespread `any`, no swallowed errors.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      // Security: no dynamic code execution anywhere.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // Test files must not be skipped or focused.
      'no-restricted-properties': [
        'error',
        { object: 'describe', property: 'skip', message: 'Do not skip tests (CLAUDE.md).' },
        { object: 'describe', property: 'only', message: 'Do not commit focused tests.' },
        { object: 'it', property: 'skip', message: 'Do not skip tests (CLAUDE.md).' },
        { object: 'it', property: 'only', message: 'Do not commit focused tests.' },
        { object: 'test', property: 'skip', message: 'Do not skip tests (CLAUDE.md).' },
        { object: 'test', property: 'only', message: 'Do not commit focused tests.' }
      ]
    }
  },
  {
    files: [
      'src/main/**/*.ts',
      'src/preload/**/*.ts',
      'src/shared/**/*.ts',
      '*.config.ts',
      'tests/**/*.ts',
      'scripts/**/*.mjs'
    ],
    languageOptions: { globals: globals.node }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The UI renderer must never reach Node or Electron directly.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['electron', 'node:*', 'fs', 'path', 'child_process'],
              message: 'The UI renderer must not import Node/Electron modules. Use the preload API.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked
  },
  prettier
)
