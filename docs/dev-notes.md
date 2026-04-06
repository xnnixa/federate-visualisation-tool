# Developer Notes (Vite Template Context)

This file keeps useful notes from the original React + TypeScript + Vite template README.
It is intentionally separated from the main project README to keep product documentation focused.

## 1. Template baseline

This project started from the React + TypeScript + Vite template.
The template provides a minimal setup with HMR and ESLint.

Common React plugin options in Vite:

- `@vitejs/plugin-react` (Babel-based Fast Refresh; supports oxc in rolldown-vite scenarios)
- `@vitejs/plugin-react-swc` (SWC-based Fast Refresh)

## 2. React Compiler note

React Compiler is not enabled by default in the template due to dev/build performance trade-offs.
If needed, follow official docs:

- https://react.dev/learn/react-compiler/installation

## 3. ESLint expansion notes (type-aware)

For production-grade TypeScript apps, consider enabling type-aware linting in ESLint by using configs such as:

- `tseslint.configs.recommendedTypeChecked`
- `tseslint.configs.strictTypeChecked`
- `tseslint.configs.stylisticTypeChecked`

This requires parser options with project references (for example `tsconfig.app.json` and `tsconfig.node.json`).


Reference snippet from the original template for enabling type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 4. Optional React lint plugins

You may additionally evaluate:

- `eslint-plugin-react-x`
- `eslint-plugin-react-dom`

Use these only if they match team standards and maintenance expectations.


Reference snippet from the original template for optional React lint plugins:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 5. Why this is in dev-notes

These notes are framework/template-oriented guidance.
They are useful for maintainers, but not essential for end users of the FEDERATE explorer.
