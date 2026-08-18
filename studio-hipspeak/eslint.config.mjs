import studio from '@sanity/eslint-config-studio'

export default [
  ...studio,
  {
    // Maintenance scripts run in Node, not in the Studio bundle.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
]
