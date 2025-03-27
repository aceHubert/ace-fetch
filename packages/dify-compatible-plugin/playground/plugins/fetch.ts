import { defineNuxtPlugin } from 'nuxt/app';
import { fetch } from '../apis';

export default defineNuxtPlugin((nuxtApp) => {
  // use 会把半前的fetch 设置成activeFetch
  nuxtApp.vueApp.use(fetch);
});
