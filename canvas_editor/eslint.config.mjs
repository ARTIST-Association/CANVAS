import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";

export default defineConfig([
  js.configs.recommended,
  jsdoc.configs["flat/recommended"],
  {
    languageOptions: { globals: globals.browser },
  },
  {
    rules: {
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
      "jsdoc/require-description": [
        "warn",
        {
          contexts: [
            "FunctionDeclaration",
            "MethodDefinition",
            "ClassDeclaration",
          ],
        },
      ],
    },
  },
]);
