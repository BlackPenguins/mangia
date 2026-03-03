export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off"
    }
  }
];