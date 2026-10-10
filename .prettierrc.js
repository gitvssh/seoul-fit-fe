/**
 * @fileoverview Prettier configuration for Seoul Fit Frontend
 * @description Code formatting rules for consistent style across the project
 * @author Seoul Fit Team
 * @version 2.0.0
 */

/**
 * Prettier Configuration
 *
 * These settings ensure consistent code formatting across the entire project.
 * All team members and contributors must use these settings.
 *
 * @see https://prettier.io/docs/en/configuration.html
 */
module.exports = {
  // Basic formatting
  semi: true, // Always use semicolons
  singleQuote: true, // Use single quotes instead of double quotes
  quoteProps: 'as-needed', // Only quote object properties when needed
  trailingComma: 'es5', // Trailing commas for ES5 compatibility

  // Indentation and spacing
  tabWidth: 2, // Use 2 spaces for indentation
  useTabs: false, // Use spaces instead of tabs

  // Line length and wrapping
  printWidth: 100, // Wrap lines at 100 characters (matches ESLint)
  proseWrap: 'preserve', // Don't wrap markdown text

  // Bracket formatting
  bracketSpacing: true, // Add spaces inside object brackets { foo: bar }
  bracketSameLine: false, // Put > of multi-line HTML/JSX on new line

  // Arrow function parentheses
  arrowParens: 'avoid', // Omit parentheses when possible: x => x

  // JSX specific
  jsxSingleQuote: true, // Use single quotes in JSX

  // End of line
  endOfLine: 'lf', // Use Unix line endings (LF)

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // File type overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
