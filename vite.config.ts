import fs from 'node:fs';
import path from 'node:path';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

const certDir = path.resolve(process.cwd(), 'certs');
const httpsConfig =
	fs.existsSync(path.join(certDir, 'localhost+2.pem')) &&
	fs.existsSync(path.join(certDir, 'localhost+2-key.pem'))
		? {
				key: fs.readFileSync(path.join(certDir, 'localhost+2-key.pem')),
				cert: fs.readFileSync(path.join(certDir, 'localhost+2.pem'))
			}
		: undefined;

export default defineConfig({
	plugins: [
		enhancedImages(),
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	build: {
		reportCompressedSize: false,
		chunkSizeWarningLimit: 1000,
		minify: 'esbuild'
	},
	esbuild: {
		logLevel: 'error'
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	},
	server: {
		https: httpsConfig,
		host: '0.0.0.0',
		port: 5173
	},
	preview: {
		https: httpsConfig,
		host: '0.0.0.0',
		port: 5173
	}
});
