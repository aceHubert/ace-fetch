import type { VariableDefinitionNode } from 'graphql';
import type {
  TypedDocumentNode,
  QueryOptions,
  MutationOptions,
  SubscriptionOptions,
  DefaultContext,
} from '@apollo/client';
import type { DocumentType } from './constants';

export interface IDocumentDefinition {
  type: DocumentType;
  name: string;
  variables: ReadonlyArray<VariableDefinitionNode>;
}

export interface TypedQueryDocumentNode<
  Result = {
    [key: string]: any;
  },
  Variables =
    | {
        [key: string]: any;
      }
    | undefined,
> extends TypedDocumentNode<Result, Variables> {
  /**
   *  This is used to ensure that RegistGraphql type set correctly
   */
  __documentType: DocumentType.Query;
}

export interface TypedMutationDocumentNode<
  Result = {
    [key: string]: any;
  },
  Variables =
    | {
        [key: string]: any;
      }
    | undefined,
> extends TypedDocumentNode<Result, Variables> {
  /**
   *  This is used to ensure that RegistGraphql type set correctly
   */
  __documentType: DocumentType.Mutation;
}

export interface TypedSubscriptionDocumentNode<
  Result = {
    [key: string]: any;
  },
  Variables =
    | {
        [key: string]: any;
      }
    | undefined,
> extends TypedDocumentNode<Result, Variables> {
  /**
   *  This is used to ensure that RegistGraphql type set correctly
   */
  __documentType: DocumentType.Subscription;
}

/**
 * catch error options
 */
export type CatchErrorOptions = {
  /**
   * error catch handler
   */
  handler?: (error: any) => Promise<any>;
};

/**
 * loading handler,
 * @return unloading handler
 */
export type LoadingHandler = (text?: string) => () => void;

/**
 * loading options
 */
export type LoadingOptions = {
  /**
   * delay (ms)
   * @default 260
   */
  delay?: number;
  /**
   * custom loading handler
   */
  handler?: LoadingHandler;
};

/**
 * retry options
 */
export type RetryOptions = {
  /**
   * max retry count
   * @default 3
   */
  maxCount?: number;
  /**
   * enabled retry delay (formula(2 ^ count - 1 / 2) * 1000 ms)
   * @default true
   */
  delay?: boolean;
  /**
   * customized retry condition
   * @default (error) => error.message === 'Network Error'
   */
  validateError?: (error: Error) => boolean;
};

export interface RequestCustomConfig {
  /**
   * enable catch error
   * or catch error by Promise.catch locally
   * @default false
   */
  catchError?: boolean;
  /**
   * enable loading
   * or custom loading handler/options
   * @default false
   */
  loading?: boolean | LoadingHandler | Required<LoadingOptions>;
  /**
   * loading text
   */
  loadingText?: string;
  /**
   * enable retry
   * or custom retry options
   * @default false
   */
  retry?: boolean | RetryOptions;
}

export interface ObserverOptions<TData> {
  onData: (data?: TData | null) => void;
  onError?: (err: unknown) => void;
  onComplete?: () => void;
}

export type DefaultRegistGraphqlDefinition = Record<
  string,
  TypedDocumentNode | TypedQueryDocumentNode | TypedMutationDocumentNode | TypedSubscriptionDocumentNode
>;

export type RegistGraphql<C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition> = {
  [P in keyof C]: C[P] extends TypedQueryDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType, Result = TData>(
        options?: Omit<QueryOptions<TVariables, TData>, 'query' | 'variables'> &
          RequestCustomConfig &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => Promise<Result>
    : C[P] extends TypedMutationDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType, TContext = DefaultContext, Result = TData>(
        options?: Omit<MutationOptions<TData, TVariables, TContext>, 'mutation' | 'variables'> &
          RequestCustomConfig &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => Promise<Result>
    : C[P] extends TypedSubscriptionDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType>(
        options?: Omit<SubscriptionOptions<TVariables, TData>, 'query' | 'variables'> &
          ObserverOptions<TData> &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => () => void
    : (options?: RequestCustomConfig & { variables?: any }) => Promise<any>;
};

/**
 * plugin options
 */
type OptionsInPlugin<O extends Record<string, any>> = {
  /**
   * 插件执行的条件，默认是在所有通过 'defineRegistApi()' 的方法执行,
   * 可以以上条件上追加条件，如在某个前缀上执行等。
   */
  // runWhen?: (config: AxiosRequestConfig) => boolean;
} & O;

export interface RegisterPluginContext<
  C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition,
> {
  /**
   * regist graphql
   */
  registGraphqls: RegistGraphql<C>;
}

/**
 * Custom registApis properties extends from plugin
 */
export interface RegistGraphqlCustomProperties<
  C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition,
> {}

/**
 * plugin definition
 */
export interface PluginDefinition<
  O extends Record<string, any>,
  C extends Record<string, TypedDocumentNode<any, any>> = DefaultRegistGraphqlDefinition,
> {
  (options?: OptionsInPlugin<O>): (
    context: RegisterPluginContext<C>,
  ) => RegistGraphql<C> & RegistGraphqlCustomProperties<C>;
}
