import { fileURLToPath, URL } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: false,
  // plugins: ['@/plugins/fetch'],
  build: {
    transpile: ['@ace-fetch/core'],
  },
  alias: {
    '@ace-fetch/core': fileURLToPath(new URL('../../core/src', import.meta.url)),
    '@ace-fetch/vue': fileURLToPath(new URL('../../vue/src', import.meta.url)),
    '@ace-fetch/dify-compatible-plugin': fileURLToPath(new URL('../src', import.meta.url)),
  },
  runtimeConfig: {
    public: {
      apiKey: '',
      text: '',
    },
  },
  vite: {
    server: {
      proxy: {
        '/dify': {
          target: 'https://dify.mytijian.com/v1',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/dify/, ''),
        },
      },
    },
  },
});
