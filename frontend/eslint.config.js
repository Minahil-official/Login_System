// eslint.config.js - ESLint configuration for code linting
// This file configures ESLint to check for code quality and style issues
// Uses the new flat config format (ESLint 9+)

// Import the base JavaScript configuration from ESLint
import js from '@eslint/js';
// Import global variables definitions (browser, node, etc.)
import globals from 'globals';
// Import React Hooks linting rules (ensures hooks are used correctly)
import reactHooks from 'eslint-plugin-react-hooks';
// Import React Refresh plugin (for hot module replacement compatibility)
import reactRefresh from 'eslint-plugin-react-refresh';
// Import TypeScript ESLint for TypeScript-specific rules
import tseslint from 'typescript-eslint';
// Import config helpers from ESLint
import { defineConfig, globalIgnores } from 'eslint/config';

// Export the ESLint configuration
export default defineConfig([
  // Ignore the dist folder (built output) from linting
  globalIgnores(['dist']),
  {
    // Apply these rules to TypeScript and TSX files
    files: ['**/*.{ts,tsx}'],
    // Extend multiple rule sets for comprehensive linting
    extends: [
      js.configs.recommended,           // Base JavaScript best practices
      tseslint.configs.recommended,     // TypeScript-specific rules
      reactHooks.configs.flat.recommended,  // React Hooks rules (deps arrays, etc.)
      reactRefresh.configs.vite,        // React Refresh compatibility rules
    ],
    // Language options for the parser
    languageOptions: {
      ecmaVersion: 2020,     // Support modern JavaScript syntax
      globals: globals.browser,  // Define browser global variables (window, document, etc.)
    },
  },
]);
