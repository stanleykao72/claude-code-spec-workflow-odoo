module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
    ],

    // Import sorting and organization
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/newline-after-import': 'error',
    'import/no-unresolved': 'off', // TypeScript handles this

    // General code quality
    'no-console': 'off', // CLI tool needs console output
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
  },
  env: {
    node: true,
    es2020: true,
  },
  overrides: [
    {
      // Frontend-specific rules
      files: ['src/dashboard/client/**/*.ts'],
      env: {
        browser: true,
        node: false,
        es2020: true,
      },
      globals: {
        'window': 'readonly',
        'document': 'readonly',
        'localStorage': 'readonly',
        'WebSocket': 'readonly',
        'Event': 'readonly',
        'CustomEvent': 'readonly',
        'HTMLElement': 'readonly',
        'Element': 'readonly',
        'fetch': 'readonly',
        'alert': 'readonly',
        'confirm': 'readonly',
        'console': 'readonly',
        'URL': 'readonly',
        'URLSearchParams': 'readonly',
      },
      rules: {
        // Frontend-specific TypeScript rules
        '@typescript-eslint/no-non-null-assertion': 'warn', // DOM access may require it
        'no-console': 'warn', // Allow console in frontend but warn
        '@typescript-eslint/no-unused-vars': ['error', { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        }],
        
        // Browser compatibility
        'no-restricted-globals': [
          'error',
          'name',
          'length',
          'close',
          'closed',
          'status',
        ],
        
        // Frontend best practices
        'no-alert': 'warn',
        'no-confirm': 'warn',
      },
    },
    {
      // Type definition files
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
      },
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};