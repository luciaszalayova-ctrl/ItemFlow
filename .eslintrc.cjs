module.exports = {
  root: true,
  ignorePatterns: [
    "**/.next/**",
    "**/dist/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/.turbo/**"
  ],
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
      ],
      rules: {
        "@typescript-eslint/consistent-type-imports": "error"
      }
    },
    {
      files: ["apps/**/*.{ts,tsx}"],
      extends: ["plugin:@next/next/recommended"]
    },
    {
      files: ["**/*.{js,mjs,cjs}"],
      env: {
        node: true,
        es2022: true
      },
      extends: ["eslint:recommended"]
    }
  ]
};

