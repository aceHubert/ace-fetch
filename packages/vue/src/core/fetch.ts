import { getCurrentInstance, inject } from 'vue-demi';
import { registApi, debug } from '@ace-fetch/core';
import { FetchInjectKey, setActiveFetch, activeFetch } from './rootFetch';

// Types
import type { MethodUrl, RegistApi } from '@ace-fetch/core';
import type { DefineRegistApiOptions, DefineRegistApiOptionsInPlugin, UseRegistApiDefinition, Fetch } from '../types';

/**
 * regist apis definition
 * @param id
 * @param options
 */
export function defineRegistApi<C extends Record<string, MethodUrl>>(
  id: string,
  options: Omit<DefineRegistApiOptions<C>, 'id'>,
): UseRegistApiDefinition<C>;
/**
 * regist apis definition
 * @param options
 */
export function defineRegistApi<C extends Record<string, MethodUrl>>(
  options: DefineRegistApiOptions<C>,
): UseRegistApiDefinition<C>;
export function defineRegistApi<C extends Record<string, MethodUrl>>(
  idOrOptions: string | DefineRegistApiOptions<C>,
  registOptions?: Omit<DefineRegistApiOptions<C>, 'id'>,
): UseRegistApiDefinition<C> {
  let id: string;
  let options: Omit<DefineRegistApiOptions<C>, 'id'>;

  if (typeof idOrOptions === 'string') {
    id = idOrOptions;
    options = registOptions!;
  } else {
    const { id: _id, ...restOptions } = idOrOptions;
    id = _id;
    options = restOptions;
  }

  let optionsForPlugin: DefineRegistApiOptionsInPlugin<C> = { ...options };

  function useRegistApi(fetch?: Fetch) {
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
      // creating regist apis register it to 'fetch._r'
      const registApis = registApi(fetch.client, options.definition || options.apis!, options.prefix, id);

      // apply all local plugins
      options.plugins?.forEach((extender) => {
        Object.assign(
          registApis,
          extender({
            id,
            registApis,
            fetch: fetch!,
            app: fetch!._a,
            options: optionsForPlugin,
          }),
        );
      });

      // apply all global plugins
      fetch._p.forEach((extender) => {
        Object.assign(
          registApis,
          extender({
            id,
            registApis,
            fetch: fetch!,
            app: fetch!._a,
            options: optionsForPlugin,
          }),
        );
      });

      fetch._r.set(id, registApis);
    }

    // get from store
    const apis: RegistApi<C> = fetch._r.get(id)!;

    return apis;
  }
  return useRegistApi;
}
