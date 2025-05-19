import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import tanstackEslint from "@tanstack/eslint-plugin-query"
import noBarrelFiles from "eslint-plugin-no-barrel-files";


export default tseslint.config(
  { ignores: ['dist', "./src/routeTree.gen.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      "@tanstack/query": tanstackEslint,
      "no-barrel-files": noBarrelFiles
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      "no-barrel-files/no-barrel-files": [
        "error"
      ],
      "@typescript-eslint/no-empty-object-type": ["off"]

      // 'react-refresh/only-export-components': [
      //   'warn',
      //   { allowConstantExport: true },
      // ],
    },
  },
)
