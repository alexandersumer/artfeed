import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));
const typeCheckedConfigs = tseslint.configs["flat/recommended-type-checked"];

export default [
  {
    ignores: ["dist", "node_modules", "ingestion/**"],
  },
  ...typeCheckedConfigs.map((config) => ({
    ...config,
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      ...(config.languageOptions ?? {}),
      parser: tsParser,
      parserOptions: {
        ...(config.languageOptions?.parserOptions ?? {}),
        project: "./tsconfig.eslint.json",
        tsconfigRootDir,
      },
    },
  })),
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: true, ignoreIIFE: true },
      ],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
];
