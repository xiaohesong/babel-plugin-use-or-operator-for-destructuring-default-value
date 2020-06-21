module.exports = {
  extends: ['airbnb', 'standard'],
  plugins: ['babel', 'prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ]
  },
};