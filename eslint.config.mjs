import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// ── Module layering ─────────────────────────────────────────────────────────
// Higher layers may import lower ones, never the reverse:
//
//   planner                          (composes everything)
//     ↓
//   tasks → goals                    (domains)
//   habits, focus, motivation
//     ↓
//   insights                         (shared data/types)
//
// Add a module's allowed dependencies here when it genuinely needs a new one.
const allowedDependencies = {
  planner: ["tasks", "goals", "habits", "focus", "motivation", "insights"],
  tasks: ["goals", "insights"],
  goals: ["insights"],
  habits: ["insights"],
  focus: ["insights"],
  motivation: ["insights"],
  insights: [],
  identity: [],
  settings: [],
  onboarding: [],
};

const publicApiMessage =
  "Import from the module's public API (@/modules/<name>) instead of its internals. Export what you need from that module's index.ts.";

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

  // ── boundaries: direction between modules + barrel-only entry ─────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      // Resolve the "@/*" alias so both plugins see real file paths.
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
      "boundaries/elements": [
        { type: "module", pattern: "src/modules/*", capture: ["name"] },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          // Last matching policy wins.
          policies: [
            // 1. Modules may not depend on each other by default…
            {
              from: { element: { type: "module" } },
              disallow: { to: { element: { type: "module" } } },
              message:
                "Module {{from.captured.name}} may not depend on {{to.captured.name}}. If this is intended, add it to allowedDependencies in eslint.config.mjs.",
            },
            // 2. …except along the declared directions.
            ...Object.entries(allowedDependencies)
              .filter(([, deps]) => deps.length > 0)
              .map(([name, deps]) => ({
                from: { element: { type: "module", captured: { name } } },
                allow: {
                  to: { element: { type: "module", captured: { name: deps } } },
                },
              })),
            // 3. Anyone (including app/ and components/) enters a module only
            //    through its barrel.
            {
              to: { element: { type: "module" } },
              disallow: { to: { element: { fileInternalPath: "!index.{ts,tsx}" } } },
              message: publicApiMessage,
            },
          ],
        },
      ],
    },
  },

  // ── import: circular dependencies (including ones hidden behind barrels) ──
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-cycle": ["error", { ignoreExternal: true }],
    },
  },

  // ── no-restricted-imports: resolver-free safety net for code outside modules
  // Boundaries already enforces this; this one is string-based, so it still
  // fires if the alias resolver is ever misconfigured.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/modules/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [{ group: ["@/modules/*/*"], message: publicApiMessage }],
        },
      ],
    },
  },
];

export default eslintConfig;
