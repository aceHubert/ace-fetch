import { Vue2 } from 'vue-demi';
import { FetchInjectKey, setActiveFetch } from './rootFetch';

export function FetchVuePlugin(Vue: any) {
  // Used to avoid multiple mixins being setup
  // when in dev mode and hot module reload
  // https://github.com/vuejs/vue/issues/5089#issuecomment-284260111
  if (Vue.$__graphql_fetch_installed__) return;
  // eslint-disable-next-line @typescript-eslint/camelcase
  Vue.$__graphql_fetch_installed__ = true;

  // Equivalent of
  // app.config.globalProperties.$fetch = fetch
  Vue.mixin({
    beforeCreate() {
      const options = this.$options;
      if (options.graphqlFetch) {
        const fetch = options.graphqlFetch;
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
        if (!this.$graphqlFetch) {
          this.$graphqlFetch = fetch;
        }

        // this allows calling useFetch() outside of a component setup after
        setActiveFetch(fetch);

        fetch._a = this as any;
      } else {
        this.$graphqlFetch = (options.parent && options.parent.$graphqlFetch) || this;
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
