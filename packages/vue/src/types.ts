import type { App } from 'vue-demi';
import type { MethodUrl, RegistApi, FetchClient } from '@ace-fetch/core';

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
 * Context argument passed to RegistApiPlugins.
 */
export interface RegisterPluginContext<C extends Record<string, MethodUrl> = any> {
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
   * regist apis
   */
  registApis: RegistApi<C>;
  /**
   * regist api options
   */
  options: DefineRegistApiOptionsInPlugin<C>;
}

/**
 * Plugin to extend every store.
 */
export interface RegistApiPlugin {
  /**
   * Plugin to extend every registApi.
   * @param context - RegisterPluginContext
   */
  (context: RegisterPluginContext): Partial<RegistApiCustomProperties> | void;
}

/**
 *  'defineRegistApi' options
 */
export interface DefineRegistApiOptions<C extends Record<string, MethodUrl>> {
  /**
   * Cached id
   */
  id: string;
  /**
   * Register api object
   * example: {
   *  getUsers: typedUrl<User[]>`get /users`,
   *  getUser: typedUrl<User, { id: string | number }>`/user/${'id'}`,
   *  addUser: typedUrl<User, any, Partial<Omit<User, 'id'>>>`post /user`,
   *  updateFile: typedUrl<string>({headers:{'content-type':'form-data'}})`post /upload/image`
   * }
   */
  apis: C;
  /**
   * Base URL
   */
  prefix?: string;
  /**
   * Plugins apply current registApis
   */
  plugins?: RegistApiPlugin[];
}

/**
 * Options use for plugin
 */
export interface DefineRegistApiOptionsInPlugin<C extends Record<string, MethodUrl>>
  extends Omit<DefineRegistApiOptions<C>, 'id'> {}

/**
 * Custom registApis properties extends from plugin
 */
export interface RegistApiCustomProperties<C extends Record<string, MethodUrl> = {}> {}

/**
 * Return type of 'defineRegistApi' result
 */
export interface RegistApiDefinition<C extends Record<string, MethodUrl>> {
  (fetch?: Fetch): RegistApi<C>;
}
