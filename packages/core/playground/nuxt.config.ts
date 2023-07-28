import { defineNuxtConfig } from 'nuxt';

export default defineNuxtConfig({
  ssr: false,
  build: {
    transpile: ['@ace-fetch/core'],
  },
});
