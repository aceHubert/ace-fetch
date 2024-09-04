import { isVue2, markRaw } from 'vue-demi';
import { warn } from '@ace-util/core';
import { debug } from '@ace-fetch/graphql';
import { FetchInjectKey, setActiveFetch } from './rootFetch';

// Types
import type { ApolloClient, ApolloClientOptions } from '@apollo/client';
import type { RegistGraphql } from '@ace-fetch/graphql';
import type { Fetch, RegistGraphqlPlugin } from '../types';

/**
 * Create fetch instance
 * @param client Apollo client
 */
export function createFetch(client: ApolloClient<any>): Fetch;
/**
 * Create fetch instance for multiple clients
 * @param clientFactory Apollo client factory
 */
export function createFetch(
  clientFactory: <TCacheShape>(options: Partial<ApolloClientOptions<TCacheShape>>) => ApolloClient<TCacheShape>,
): Fetch;
export function createFetch(
  clientOrFactory:
    | ApolloClient<any>
    | (<TCacheShape>(options: Partial<ApolloClientOptions<TCacheShape>>) => ApolloClient<TCacheShape>),
): Fetch {
  const _p: Fetch['_p'] = [];
  // plugins added before calling app.use(pinia)
  let toBeInstalled: RegistGraphqlPlugin[] = [],
    client: ApolloClient<any>,
    clientFactory: <TCacheShape>(options: Partial<ApolloClientOptions<TCacheShape>>) => ApolloClient<TCacheShape>;

  if (typeof clientOrFactory === 'function') {
    clientFactory = clientOrFactory;
    client = clientFactory({});
  } else {
    clientFactory = (options: Partial<ApolloClientOptions<any>>) => {
      warn(debug, 'For multiple clients support, use createFetch(clientFactory) instead of createFetch(client)!');
      return clientOrFactory;
    };
    client = clientOrFactory;
  }

  const fetch: Fetch = markRaw({
    install(app) {
      // this allows calling useFetch() outside of a component setup after
      setActiveFetch(fetch);

      if (!isVue2) {
        fetch._a = app;
        app.provide(FetchInjectKey, fetch);
        app.config.globalProperties.$graphqlFetch = fetch;

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
    _r: new Map<string, RegistGraphql<any>>(),
    // regist api plugins
    _p,
    client,
    clientFactory,
  });

  return fetch;
}
