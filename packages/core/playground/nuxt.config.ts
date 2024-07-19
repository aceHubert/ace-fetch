import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: false,
  build: {
    transpile: ['@ace-fetch/core'],
  },
  compatibilityDate: '2024-07-19',
});
