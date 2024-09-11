import { getCurrentInstance, inject } from 'vue-demi';
import { registGraphql, debug } from '@ace-fetch/graphql';
import { FetchInjectKey, setActiveFetch, activeFetch } from './rootFetch';

// Types
import type { TypedDocumentNode } from '@apollo/client';
import type { RegistGraphql } from '@ace-fetch/graphql';
import type {
  DefineRegistGraphqlOptions,
  DefineRegistGraphqlOptionsInPlugin,
  UseRegistGraphqlDefinition,
  Fetch,
} from '../types';

/**
 * regist graphqls definition
 * @param {string|Symbol} id Regist id
 * @param {Object} options Regist options
 */
export function defineRegistGraphql<C extends Record<string, TypedDocumentNode<any, any>>>(
  id: string | Symbol,
  options: DefineRegistGraphqlOptions<C>,
): UseRegistGraphqlDefinition<C>;
/**
 * regist graphqls definition
 * @param {Object} options Regist options
 * @param {string|Symbol} options.id Regist id
 */
export function defineRegistGraphql<C extends Record<string, TypedDocumentNode<any, any>>>(
  options: DefineRegistGraphqlOptions<C> & { id: string | Symbol },
): UseRegistGraphqlDefinition<C>;
export function defineRegistGraphql<C extends Record<string, TypedDocumentNode<any, any>>>(
  idOrOptions: string | Symbol | (DefineRegistGraphqlOptions<C> & { id: string | Symbol }),
  registOptions?: Omit<DefineRegistGraphqlOptions<C>, 'id'>,
): UseRegistGraphqlDefinition<C> {
  let id: string | Symbol;
  let options: DefineRegistGraphqlOptions<C>;

  if (typeof idOrOptions === 'string' || idOrOptions instanceof Symbol) {
    id = idOrOptions;
    options = registOptions!;
  } else {
    const { id: _id, ...restOptions } = idOrOptions;
    id = _id;
    options = restOptions;
  }

  let optionsForPlugin: DefineRegistGraphqlOptionsInPlugin<C> = { ...options };

  function useRegistGraphql(fetch?: Fetch) {
    const currentInstance = getCurrentInstance();

    fetch = fetch || (currentInstance && inject(FetchInjectKey)) || undefined;
    if (fetch) setActiveFetch(fetch);

    if (debug && !activeFetch) {
      throw new Error(
        `getActiveFetch was called with no active Fetch. Did you forget to install fetch?\n` +
          `\tconst fetch = createFetch()\n` +
          `\tapp.use(fetch)\n` +
          `This will fail in production.`,
      );
    }

    fetch = activeFetch!;

    if (!fetch._r.has(id)) {
      let client = fetch.client;
      if (options.clientOptions) {
        client = fetch.clientFactory(options.clientOptions);
      }
      // creating regist graphqls register it to 'fetch._r'
      const registGraphqls = registGraphql(client, options.definition);

      // apply all local plugins
      options.plugins?.forEach((extender) => {
        Object.assign(
          registGraphqls,
          extender({
            id,
            registGraphqls,
            fetch: fetch!,
            app: fetch!._a,
            options: optionsForPlugin,
          }),
        );
      });

      // apply all global plugins
      fetch._p.forEach((extender) => {
        Object.assign(
          registGraphqls,
          extender({
            id,
            registGraphqls,
            fetch: fetch!,
            app: fetch!._a,
            options: optionsForPlugin,
          }),
        );
      });

      fetch._r.set(id, registGraphqls);
    }

    // get from store
    const graphqls: RegistGraphql<C> = fetch._r.get(id)!;

    return graphqls;
  }
  return useRegistGraphql;
}
