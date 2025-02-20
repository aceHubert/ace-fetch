import type { Prefix, MethodUrl, RegistApi, FetchClient, PluginDefinition } from '@ace-fetch/core';

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export interface Fetch {
  /**
   * Current fetch client with `Vue.createFetch()`
   */
  client: FetchClient;
  /**
   * Add a plugin to use every regist api
   */
  use: (plugin: RegistApiPlugin) => Fetch;
  /**
   * Installed regist api plugins
   *
   * @internal
   */
  _p: RegistApiPlugin[];
  /**
   * stored regist apis
   * @internal
   */
  _r: Map<string | Symbol, RegistApi<any>>;
}

export interface FetchConsumerProps {
  /**
   * Fetch instance
   */
  fetch?: Fetch;
}

/**
 *  'defineRegistApi' options
 */
export type DefineRegistApiOptions<C extends Record<string, MethodUrl>> = {
  /**
   * Base URL
   */
  prefix?: Prefix;
  /**
   * Plugins apply current registApis
   */
  plugins?: RegistApiPlugin[];
} & XOR<
  {
    /**
     * Api definition
     * @example {
     *  getUsers: typedUrl<User[]>`get /users`,
     *  getUser: typedUrl<User, { id: string | number }>`/user/${'id'}`,
     *  addUser: typedUrl<User, any, Partial<Omit<User, 'id'>>>`post /user`,
     *  updateFile: typedUrl<string>({headers:{'content-type':'form-data'}})`post /upload/image`
     * }
     */
    definition: C;
  },
  {
    /**
     * Register api object
     * @deprecated use `definition` instead
     */
    apis: C;
  }
>;

/**
 * Use regist api definition
 */
export interface UseRegistApiDefinition<C extends Record<string, MethodUrl>> {
  (fetch?: Fetch): RegistApi<C>;
}

/**
 * Plugin to extend every store.
 */
export type RegistApiPlugin = ReturnType<PluginDefinition<any>>;

/**
 * Plugin extended options
 */
export interface DefineRegistApiOptionsInPlugin<C extends Record<string, MethodUrl>>
  extends Omit<DefineRegistApiOptions<C>, 'id'> {}

declare module '@ace-fetch/core' {
  /**
   * Context argument passed to RegistApiPlugins.
   */
  export interface RegisterPluginContext<C extends Record<string, MethodUrl> = Record<string, MethodUrl>> {
    /**
     * Register id
     */
    id: string | Symbol;
    /**
     * Fetch
     */
    fetch: Fetch;
    /**
     * regist api options
     */
    options: DefineRegistApiOptionsInPlugin<C>;
  }
}
