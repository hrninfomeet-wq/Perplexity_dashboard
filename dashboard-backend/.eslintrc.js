module.exports = {
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended'
  ],
  rules: {
    'no-console': 'off', // Allow console in Node.js backend
    'no-undef': 'error',
    'consistent-return': 'warn',
    'no-case-declarations': 'error'
  },
  globals: {
    // Node.js globals
    require: 'readonly',
    module: 'readonly',
    process: 'readonly',
    console: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
    Buffer: 'readonly',
    setInterval: 'readonly',
    setTimeout: 'readonly',
    clearInterval: 'readonly',
    clearTimeout: 'readonly'
  }
};
