import eslint from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginStorybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  eslintConfigPrettier,
  reactRefresh.configs.recommended,
  pluginQuery.configs["flat/recommended"],
  {
    ignores: [
      "tailwind.config.js",
      "build", // ignore the build folder
    ],
  },
  // catch React.FC which is not recommended. See more details here https://stackoverflow.com/a/76818791/5846481
  {
    rules: {
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            "React.FC": {
              message:
                "Useless and has some drawbacks, see https://github.com/facebook/create-react-app/pull/8177",
            },
            "React.FunctionComponent": {
              message:
                "Useless and has some drawbacks, see https://github.com/facebook/create-react-app/pull/8177",
            },
            "React.FunctionalComponent": {
              message:
                "Preact specific, useless and has some drawbacks, see https://github.com/facebook/create-react-app/pull/8177",
            },
          },
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  // sort imports
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      storybook: eslintPluginStorybook,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
);
