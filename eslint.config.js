const js = require('@eslint/js');
const globals = require('globals');

// Configuración "flat" de ESLint (v9+). El proyecto es Node/CommonJS.
module.exports = [
  { ignores: ['node_modules/**', 'coverage/**'] },

  js.configs.recommended,

  // Código de servidor (Node, CommonJS).
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // Variables sin usar como advertencia; se ignoran args de convención (_, next).
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Scripts client-side servidos desde /public (corren en el navegador).
  {
    files: ['public/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.serviceworker },
    },
  },

  // Tests con Jest.
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
];
