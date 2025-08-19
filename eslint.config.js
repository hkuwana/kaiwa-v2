import prettier from 'eslint-config-prettier';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',

			// 🎯 KAIWA DESIGN PRINCIPLES - Functional Core, Imperative Shell

			// 1. FUNCTIONAL CORE RULES
			'@typescript-eslint/no-explicit-any': 'error', // No any types

			// 2. BASIC TYPE SAFETY RULES
			'@typescript-eslint/no-unused-vars': 'error', // No unused variables
			'@typescript-eslint/no-unused-expressions': 'error', // No unused expressions

			// 3. STANDARD RULES
			'@typescript-eslint/no-non-null-assertion': 'error',

			// 4. GLOBAL RULES
			// 'no-console': 'warn', // Warn about console usage
			'no-debugger': 'error', // No debugger statements
			'no-alert': 'error', // No alert statements
			'no-eval': 'error', // No eval usage
			'no-implied-eval': 'error', // No implied eval
			'no-new-func': 'error', // No new Function()
			'no-script-url': 'error', // No javascript: URLs
			'no-var': 'error', // Use const/let instead of var
			'prefer-const': 'error', // Prefer const over let
			'no-unused-vars': 'off' // Turned off in favor of TypeScript version
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},

	// 🎯 ARCHITECTURE RULE: PREVENT SERVICES FROM IMPORTING EACH OTHER
	{
		files: ['src/lib/services/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['$lib/services/**'],
							message: 'Services should not import other services. Use a store to orchestrate them.'
						}
					]
				}
			]
		}
	},
	{
		files: ['src/lib/server/services/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['$lib/server/services/**', '$lib/services/**'],
							message:
								'Server services should not import other services. Orchestrate calls in your +server.ts files or API handlers.'
						}
					]
				}
			]
		}
	}
);
