import { fileURLToPath, URL } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: false,
  build: {
    transpile: ['@ace-fetch/core'],
  },
  alias: {
    '@ace-fetch/core': fileURLToPath(new URL('..//src', import.meta.url)),
  },
});
