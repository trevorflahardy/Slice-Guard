import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    ...vue.configs['flat/recommended'],
    prettier,
    {
        files: ['**/*.{js,ts,vue}'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: typescriptParser,
                ecmaVersion: 2022,
                sourceType: 'module',
            },
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                FormData: 'readonly',
                Headers: 'readonly',
                RequestInit: 'readonly',
                HTMLElement: 'readonly',
                HTMLInputElement: 'readonly',
                MouseEvent: 'readonly',
                KeyboardEvent: 'readonly',
                Event: 'readonly',
                Node: 'readonly',
                console: 'readonly',
                btoa: 'readonly',
                alert: 'readonly',
                WebSocket: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
            vue,
        },
        rules: {
            // Vue rules
            'vue/multi-word-component-names': 'off',
            'vue/no-unused-vars': 'error',

            // TypeScript rules
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',

            // Code style rules
            curly: ['error', 'all'], // Always require braces for if statements
            'brace-style': ['error', '1tbs'],
            'no-console': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always'],
            indent: ['error', 4, { SwitchCase: 1 }], // 4 space indentation

            // Prevent one-liner if statements
            'nonblock-statement-body-position': ['error', 'below'],
        },
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            ...typescript.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': 'error',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', '*.config.*'],
    },
];
