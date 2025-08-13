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
			'no-unused-vars': 'off', // Turned off in favor of TypeScript version
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
	// 🎯 STRICT RULES FOR KERNEL/CORE FILES
	{
		files: ['**/kernel/**/*.ts', '**/core/**/*.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'error', // No any types in core
			'@typescript-eslint/explicit-function-return-type': 'error', // All functions must have return types
			'@typescript-eslint/no-unused-vars': 'error', // No unused variables
			'@typescript-eslint/no-unused-expressions': 'error', // No unused expressions
			'@typescript-eslint/no-non-null-assertion': 'error',
			'no-console': 'error', // No console in core files
			'no-debugger': 'error', // No debugger statements
			'no-alert': 'error', // No alert statements
			'no-eval': 'error', // No eval usage
			'no-implied-eval': 'error', // No implied eval
			'no-new-func': 'error', // No new Function()
			'no-script-url': 'error', // No javascript: URLs
			'no-var': 'error', // Use const/let instead of var
			'prefer-const': 'error', // Prefer const over let
		}
	}
);
