import react from "eslint-plugin-react";
import globals from "globals";

export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    ignores: ["node_modules/**", "src/prototype/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
         globals: {
        ...globals.browser
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "warn",
      "no-undef": "error"
   
   
    }
  }
];