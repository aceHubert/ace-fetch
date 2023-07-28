import { defineNuxtPlugin } from 'nuxt/app';
import { fetch } from '../apis';
import { pluginFetch } from '../apis/pluginFetch';

export default defineNuxtPlugin((nuxtApp) => {
  // vue3中 use 后 plugin 才可以使用
  nuxtApp.vueApp.use(pluginFetch);
  // use 会把半前的fetch 设置成activeFetch
  nuxtApp.vueApp.use(fetch);
});
