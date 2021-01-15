module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  settings: {
    "import/resolver": {
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  extends: [
    "airbnb-base",
    "prettier",
    "prettier/@typescript-eslint",
    "prettier/babel",
    "prettier/prettier",
    "prettier/standard",
  ],
  plugins: ["prettier", "@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  // add your custom rules here
  rules: {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "import/extensions": "off",
    "import/no-unresolved": "off",
    "prefer-promise-reject-errors": "off",
    "no-process-env": "off",
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off",
    "max-classes-per-file": "off",
    "consistent-return": "off",
    "spaced-comment": 'off',
    "global-require": 'off'
  },
};
