import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "content/modes/**",
      "inspiration/**",
      "**/*.js",
      "**/*.mjs"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      import: importPlugin,
      promise: promisePlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "unused-imports": unusedImports
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports"
        }
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        {
          groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ],
      "promise/always-return": "off",
      "promise/catch-or-return": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true
        }
      ]
    }
  },
  eslintConfigPrettier
);
