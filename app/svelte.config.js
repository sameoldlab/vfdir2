import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-auto'

/** @type {import('@sveltejs/kit').Config} */
export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess({
    script: true
  }),
  compilerOptions: {
    experimental: {
      async: true
    }
  },

  kit: {
    adapter: adapter({
      fallback: 'index.html'
    }),
    experimental: {
      remoteFunctions: true
    }
  }
}
