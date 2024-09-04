import { Fetch } from '../types';

// Extensions of Vue types to be appended manually
// https://github.com/microsoft/rushstack/issues/2090
// https://github.com/microsoft/rushstack/issues/1709

// @ts-ignore: works on Vue 2, fails in Vue 3
declare module 'vue/types/vue' {
  interface Vue {
    /**
     * @deprecated Use `$apiFetch` instead.
     */
    $afetch: Fetch;
    /**
     * Currently installed fetch instance.
     */
    $apiFetch: Fetch;
  }
}

// @ts-ignore: works on Vue 2, fails in Vue 3
declare module 'vue/types/options' {
  interface ComponentOptions<V> {
    /**
     * @deprecated Use `apiFetch` instead.
     */
    afetch?: Fetch;
    /**
     * Fetch instance to install in your application. Should be passed to the
     * root Vue.
     */
    apiFetch?: Fetch;
  }
}

// @ts-ignore: works on Vue 3, fails in Vue 2
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    /**
     * @deprecated Use `$apiFetch` instead.
     */
    $afetch: Fetch;
    /**
     * Access to the application's Fetch
     */
    $apiFetch: Fetch;
  }
}
