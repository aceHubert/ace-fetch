import type { App } from 'vue-demi';
import type { ApolloClient, ApolloClientOptions, TypedDocumentNode } from '@apollo/client';
import type { RegistGraphql, DefaultRegistGraphqlDefinition, PluginDefinition } from '@ace-fetch/graphql';

export interface Fetch {
  /**
   * Install fetch plugin
   */
  install: (app: App) => void;
  /**
   * Apollo client factory with `Vue.createFetch()`
   */
  clientFactory: <TCacheShape>(options: Partial<ApolloClientOptions<TCacheShape>>) => ApolloClient<TCacheShape>;
  /**
   * Default apollo client
   */
  client: ApolloClient<any>;
  /**
   * Add a plugin to use every regist api
   */
  use: (plugin: RegistGraphqlPlugin) => Fetch;
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
  _p: RegistGraphqlPlugin[];
  /**
   * stored regist graphqls
   * @internal
   */
  _r: Map<string | Symbol, RegistGraphql<any>>;
}

/**
 *  'defineRegistGraphql' options
 */
export interface DefineRegistGraphqlOptions<
  C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition,
> {
  /**
   * Register graphql object
   */
  definition: C;
  /**
   * Apollo client options,
   * will use clientFactory to create a new client for current regist graphql definition
   */
  clientOptions?: Partial<ApolloClientOptions<any>>;
  /**
   * Plugins apply current registApis
   */
  plugins?: RegistGraphqlPlugin[];
}

/**
 * Use regist graphql definition
 */
export interface UseRegistGraphqlDefinition<
  C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition,
> {
  (fetch?: Fetch): RegistGraphql<C>;
}

/**
 * Plugin to extend every store.
 */
export type RegistGraphqlPlugin = ReturnType<PluginDefinition<any>>;

/**
 * Plugin extended options
 */
export interface DefineRegistGraphqlOptionsInPlugin<
  C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition,
> extends Omit<DefineRegistGraphqlOptions<C>, 'id'> {}

declare module '@ace-fetch/graphql' {
  /**
   * Context argument passed to RegistGraphqlPlugins.
   */
  export interface RegisterPluginContext<
    C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition,
  > {
    /**
     * Register id
     */
    id: string | Symbol;
    /**
     * Fetch
     */
    fetch: Fetch;
    /**
     * Current app created with `Vue.createApp()`.
     */
    app: App;
    /**
     * regist graphql options
     */
    options: DefineRegistGraphqlOptionsInPlugin<C>;
  }
}
