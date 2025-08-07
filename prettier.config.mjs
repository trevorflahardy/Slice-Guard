/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  singleAttributePerLine: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  plugins: ['@prettier/plugin-xml', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue',
      },
    },
    {
      files: '*.xml',
      options: {
        parser: 'xml',
        xmlWhitespaceSensitivity: 'ignore',
      },
    },
  ],
};

export default config;
