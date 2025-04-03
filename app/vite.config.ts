import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'

const target = 'es2022'
// https://vitejs.dev/config/
export default defineConfig(({ }) => ({
	server: {
		port: 5461,
	},
	esbuild: { target },
	optimizeDeps: {
		esbuildOptions: { target }
	},
	build: {
		assetsInlineLimit: Infinity,
		target,
	},
	plugins: [sveltekit()],
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.{test,test.svelte,spec}.{js,ts}'],
		browser: {
			enabled: true,
			name: 'brave'
		}
	}

}))
