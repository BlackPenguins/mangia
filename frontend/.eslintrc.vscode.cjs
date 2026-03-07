const js =  require("@eslint/js");
const react =  require("eslint-plugin-react");
const globals =  require("globals");
const reactHooks = require("eslint-plugin-react-hooks");


module.exports = [
  {
    files: ["**/*.js"],
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
      react,
      "react-hooks": reactHooks,

    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,


      "react/jsx-uses-react": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "array-callback-return": "warn",
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  }
];