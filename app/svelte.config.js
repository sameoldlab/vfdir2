import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-static'

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
    router: {
      type: "hash"
    },
    output: {
      bundleStrategy: 'inline',
    },
    adapter: adapter({
      fallback: 'index.html'
    }),
    experimental: {
      remoteFunctions: true
    }
  }
}
