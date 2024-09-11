import type { App } from 'vue-demi';
import type { MethodUrl, RegistApi, FetchClient, PluginDefinition } from '@ace-fetch/core';

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export interface Fetch {
  /**
   * Install fetch plugin
   */
  install: (app: App) => void;
  /**
   * Current fetch client with `Vue.createFetch()`
   */
  client: FetchClient;
  /**
   * Add a plugin to use every regist api
   */
  use: (plugin: RegistApiPlugin) => Fetch;
  /**
   * App linked to this Fetch instance
   * @internal
   */
  _a: App;
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
  _r: Map<string, RegistApi<any>>;
}

/**
 *  'defineRegistApi' options
 */
export type DefineRegistApiOptions<C extends Record<string, MethodUrl>> = {
  /**
   * Cached id
   */
  id: string;

  /**
   * Base URL
   */
  prefix?: string;
  /**
   * Plugins apply current registApis
   */
  plugins?: RegistApiPlugin[];
} & XOR<
  {
    /**
     * Register api object
     * @deprecated use `definition` instead
     */
    apis: C;
  },
  {
    /**
     * Api definition
     * example: {
     *  getUsers: typedUrl<User[]>`get /users`,
     *  getUser: typedUrl<User, { id: string | number }>`/user/${'id'}`,
     *  addUser: typedUrl<User, any, Partial<Omit<User, 'id'>>>`post /user`,
     *  updateFile: typedUrl<string>({headers:{'content-type':'form-data'}})`post /upload/image`
     * }
     */
    definition: C;
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
    id: string;
    /**
     * Fetch
     */
    fetch: Fetch;
    /**
     * Current app created with `Vue.createApp()`.
     */
    app: App;
    /**
     * regist api options
     */
    options: DefineRegistApiOptionsInPlugin<C>;
  }
}
