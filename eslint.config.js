import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        ignores: ['node_modules', 'dist']
    },
    {
        files: ['src/**/*.{js,ts}', '!src/**/*.astro'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                fetch: 'readonly',
                structuredClone: 'readonly',
                Response: 'readonly',
                URL: 'readonly',
                File: 'readonly',
                FormDataEntryValue: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ]
        }
    }
];
