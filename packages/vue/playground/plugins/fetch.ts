import { defineNuxtPlugin } from 'nuxt/app';
import { fetch } from '@/apis';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(fetch);
});
