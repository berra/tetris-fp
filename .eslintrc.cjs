module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      env: {
        browser: true,
      },
      rules: {
        // TypeScript itself already catches these (and does so more
        // accurately) via tsconfig's noUnusedLocals/noUnusedParameters
        // and its own undefined-symbol checking.
        'no-undef': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
      },
    },
  ],
}
