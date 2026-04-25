import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "next-env.d.ts",
    "out/**",
    "dist/**",
    "build/**",
    "design/**",
    ".claude/**",
    ".superpowers/**",
    ".worktrees/**",
    "~/**",
  ]),
];

export default eslintConfig;
