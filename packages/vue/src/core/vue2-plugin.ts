import { Vue2 } from 'vue-demi';
import { FetchInjectKey, setActiveFetch } from './rootFetch';

export function FetchVuePlugin(Vue: any) {
  // Used to avoid multiple mixins being setup
  // when in dev mode and hot module reload
  // https://github.com/vuejs/vue/issues/5089#issuecomment-284260111
  if (Vue.$__api_fetch_installed__) return;
  // eslint-disable-next-line @typescript-eslint/camelcase
  Vue.$__api_fetch_installed__ = true;

  // Equivalent of
  // app.config.globalProperties.$fetch = fetch
  Vue.mixin({
    beforeCreate() {
      const options = this.$options;
      if (options.apiFetch || options.afetch) {
        const fetch = options.apiFetch || options.afetch;
        // HACK: taken from provide(): https://github.com/vuejs/composition-api/blob/main/src/apis/inject.ts#L31
        if (!(this as any)._provided) {
          const provideCache = {};
          Object.defineProperty(this, '_provided', {
            get: () => provideCache,
            set: (v) => Object.assign(provideCache, v),
          });
        }
        (this as any)._provided[FetchInjectKey as any] = fetch;

        // propagate the fetch instance in an SSR friendly way
        // avoid adding it to nuxt twice
        // @Deprecated
        if (!this.$afetch) {
          this.$afetch = fetch;
        }
        if (!this.$apiFetch) {
          this.$apiFetch = fetch;
        }

        // this allows calling useFetch() outside of a component setup after
        setActiveFetch(fetch);

        fetch._a = this as any;
      } else {
        // @Deprecated
        this.$afetch = (options.parent && options.parent.$afetch) || this;
        this.$apiFetch = (options.parent && options.parent.$apiFetch) || this;
      }
    },
  });
}

// Auto install if it is not done yet and `window` has `Vue` in Vue2.
// To allow users to avoid auto-installation in some cases,
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(FetchVuePlugin);
}

// @internal
declare global {
  interface Window {
    Vue: typeof Vue2;
  }
}
