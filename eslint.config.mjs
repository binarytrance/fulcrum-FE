import { readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const modulesDir = join(__dirname, "src/modules");
const moduleNames = readdirSync(modulesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const deepImportMessage =
  "Import from the module's public API (@/modules/<name>) instead of its internals. Export what you need from that module's index.ts.";

// Each module may deep-import its own files, but only the barrel of others.
const moduleBoundaryRules = moduleNames.map((name) => ({
  files: [`src/modules/${name}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: moduleNames
              .filter((other) => other !== name)
              .map((other) => `@/modules/${other}/*`),
            message: deepImportMessage,
          },
        ],
      },
    ],
  },
}));

// Everything outside modules (app routes, shared components, lib, ...).
const outsideModulesRule = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/modules/**"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [{ group: ["@/modules/*/*"], message: deepImportMessage }],
      },
    ],
  },
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  ...moduleBoundaryRules,
  outsideModulesRule,
];

export default eslintConfig;
