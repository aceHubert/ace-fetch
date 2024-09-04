import { isVue2, markRaw } from 'vue-demi';
import { FetchInjectKey, setActiveFetch } from './rootFetch';

// Types
import type { FetchClient, RegistApi } from '@ace-fetch/core';
import type { Fetch, RegistApiPlugin } from '../types';

export function createFetch(client: FetchClient): Fetch {
  const _p: Fetch['_p'] = [];
  // plugins added before calling app.use(pinia)
  let toBeInstalled: RegistApiPlugin[] = [];

  const fetch: Fetch = markRaw({
    install(app) {
      // this allows calling useFetch() outside of a component setup after
      setActiveFetch(fetch);

      if (!isVue2) {
        fetch._a = app;
        app.provide(FetchInjectKey, fetch);
        app.config.globalProperties.$afetch = fetch;
        app.config.globalProperties.$apiFetch = fetch;

        toBeInstalled.forEach((plugin) => _p.push(plugin));
        toBeInstalled = [];
      }
    },
    use(plugin) {
      if (!this._a && !isVue2) {
        toBeInstalled.push(plugin);
      } else {
        _p.push(plugin);
      }
      return this;
    },
    // it's actually undefined here
    // @ts-expect-error set in install when using Vue 3
    _a: null,
    // store regist apis
    _r: new Map<string, RegistApi<any>>(),
    // regist api plugins
    _p,
    client,
  });

  return fetch;
}
