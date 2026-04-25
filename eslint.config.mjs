import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "next-env.d.ts",
      "out/**",
      "dist/**",
      "build/**",
      "design/**",
    ],
  },
];

export default eslintConfig;
