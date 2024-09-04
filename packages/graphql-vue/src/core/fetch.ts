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
 * @param id
 * @param options
 */
export function defineRegistGraphql<C extends Record<string, TypedDocumentNode<any, any>>>(
  id: string,
  options: Omit<DefineRegistGraphqlOptions<C>, 'id'>,
): UseRegistGraphqlDefinition<C>;
/**
 * regist graphqls definition
 * @param options
 */
export function defineRegistGraphql<C extends Record<string, TypedDocumentNode<any, any>>>(
  options: DefineRegistGraphqlOptions<C>,
): UseRegistGraphqlDefinition<C>;
export function defineRegistGraphql<C extends Record<string, TypedDocumentNode<any, any>>>(
  idOrOptions: string | DefineRegistGraphqlOptions<C>,
  registOptions?: Omit<DefineRegistGraphqlOptions<C>, 'id'>,
): UseRegistGraphqlDefinition<C> {
  let id: string;
  let options: Omit<DefineRegistGraphqlOptions<C>, 'id'>;

  if (typeof idOrOptions === 'string') {
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
