import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "spa/dist/**",
    "out/**",
    "build/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
