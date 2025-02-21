import { registApi, debug } from '@ace-fetch/core';
import { setActiveFetch, getContextFetch, activeFetch } from './context';

// Types
import type { MethodUrl, RegistApi } from '@ace-fetch/core';
import type { DefineRegistApiOptions, DefineRegistApiOptionsInPlugin, UseRegistApiDefinition, Fetch } from '../types';

/**
 * regist apis definition
 * @param {string|Symbol} id Regist id
 * @param {object} options Regist options
 */
export function defineRegistApi<C extends Record<string, MethodUrl>>(
  id: string | Symbol,
  options: DefineRegistApiOptions<C>,
): UseRegistApiDefinition<C>;
/**
 * regist apis definition
 * @param {Object} options Regist options
 * @param {string|Symbol} options.id Regist id
 */
export function defineRegistApi<C extends Record<string, MethodUrl>>(
  options: DefineRegistApiOptions<C> & { id: string | Symbol },
): UseRegistApiDefinition<C>;
export function defineRegistApi<C extends Record<string, MethodUrl>>(
  idOrOptions: string | Symbol | (DefineRegistApiOptions<C> & { id: string | Symbol }),
  registOptions?: DefineRegistApiOptions<C>,
): UseRegistApiDefinition<C> {
  let id: string | Symbol;
  let options: DefineRegistApiOptions<C>;

  if (typeof idOrOptions === 'string' || idOrOptions instanceof Symbol) {
    id = idOrOptions;
    options = registOptions!;
  } else {
    const { id: _id, ...restOptions } = idOrOptions;
    id = _id;
    options = restOptions;
  }

  let optionsForPlugin: DefineRegistApiOptionsInPlugin<C> = { ...options };

  function useRegistApi(fetch?: Fetch) {
    fetch = fetch || getContextFetch() || undefined;
    if (fetch) setActiveFetch(fetch);

    if (debug && !activeFetch) {
      throw new Error(
        `getActiveFetch was called with no active Fetch. Did you forget to use FetchProvider?\n` +
          `\tconst { Provider: FetchProvider } = createFetch()\n` +
          `\t<FetchProvider><Component /></FetchProvider>\n` +
          `This will fail in production.`,
      );
    }

    fetch = activeFetch!;

    if (!fetch._r.has(id)) {
      // creating regist apis register it to 'fetch._r'
      // FIXME: Build type error
      const registApis = registApi(fetch.client, options.definition || options.apis!, options.prefix as any, id);

      // apply all local plugins
      options.plugins?.forEach((extender) => {
        Object.assign(
          registApis,
          extender({
            id,
            registApis,
            fetch: fetch!,
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
