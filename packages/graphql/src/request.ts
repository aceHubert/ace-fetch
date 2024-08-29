import snakeCase from 'lodash.snakecase';
import { DocumentType, parser } from './parser';
import codes from './codes.json';

// Types
import type { DocumentNode, GraphQLFormattedError } from 'graphql';
import type {
  ApolloClient,
  OperationVariables,
  TypedDocumentNode,
  QueryOptions,
  MutationOptions,
  SubscriptionOptions,
  DefaultContext,
} from '@apollo/client/core';

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
   *  This is used to ensure that RegistApi type set correctly
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
   *  This is used to ensure that RegistApi type set correctly
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
   *  This is used to ensure that RegistApi type set correctly
   */
  __documentType: DocumentType.Subscription;
}

export type LoadingProp = (text?: string) => void | (() => void);

export interface Options {
  loading: LoadingProp;
  loadingDelay: number;
  onCatch: (err: unknown) => void;
  /**
   * graphql error code 对应 http code 关系
   */
  graphqlErrorCodes: Record<string, number>;
}

export interface RequestOptions<TData, Result = TData> {
  /**
   * 是否显示 loading
   * @default false
   */
  loading?: boolean | LoadingProp;
  /**
   * loading 时显示的自定义文本
   */
  loadingText?: string;
  /**
   * 是否使用全局捕获错误，否则 throw 至 catch 中
   * @default false
   */
  catchError?: boolean;
  /**
   * 对成功数据进行预处理
   */
  onSuccess?: (data: TData | null | undefined) => Result | null | undefined;
  /**
   * 对异常进行预处理，当 errorPolicy 为 "all" 时，异常信息会通过 onError 传递，
   * 或 cacheError 为 false 时，在 throw error 前会调用 onError (error 对象可被修改)。
   * ErrorPolicy 说明： https://www.apollographql.com/docs/react/data/error-handling#graphql-error-policies
   */
  onError?: (err: unknown) => void;
}

export interface ObserverOptions<TData> {
  onData: (data?: TData | null) => void;
  onError?: (err: unknown) => void;
  onComplete?: () => void;
}

export type RegistApiDefinition = Record<
  string,
  DocumentNode | TypedQueryDocumentNode | TypedMutationDocumentNode | TypedSubscriptionDocumentNode
>;

export type RegistApi<C extends RegistApiDefinition> = {
  [P in keyof C]: C[P] extends TypedQueryDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType, Result = TData>(
        options?: Omit<QueryOptions<TVariables, TData>, 'query' | 'variables'> &
          RequestOptions<TData> &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => Promise<Result>
    : C[P] extends TypedMutationDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType, TContext = DefaultContext, Result = TData>(
        options?: Omit<MutationOptions<TData, TVariables, TContext>, 'mutation' | 'variables'> &
          RequestOptions<TData> &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => Promise<Result>
    : C[P] extends TypedSubscriptionDocumentNode<infer ResultType, infer VariablesType>
    ? <TData = ResultType, TVariables = VariablesType>(
        options?: Omit<SubscriptionOptions<TVariables, TData>, 'query' | 'variables'> &
          ObserverOptions<TData> &
          (TVariables extends null | undefined ? { variables?: NonNullable<TVariables> } : { variables: TVariables }),
      ) => () => void
    : (options?: RequestOptions<any> & { variables?: any }) => Promise<any>;
};

export class GraphQLInnerError extends Error {
  graphQLErrors: ReadonlyArray<GraphQLFormattedError>;

  constructor(message: string, graphQLErrors: ReadonlyArray<GraphQLFormattedError>) {
    super(message);
    Object.setPrototypeOf(this, GraphQLInnerError.prototype);
    this.graphQLErrors = graphQLErrors;
    this.name = 'GraphQLInnerError';
  }
}

export class Request {
  private options: Options;

  constructor(private readonly client: ApolloClient<any>, options: Partial<Options> = {}) {
    const { loading = () => () => {}, loadingDelay = 300, onCatch = () => {}, graphqlErrorCodes } = options;

    this.options = {
      loading,
      loadingDelay,
      onCatch,
      graphqlErrorCodes:
        graphqlErrorCodes ??
        Object.keys(codes).reduce((prev, key) => {
          prev[snakeCase(codes[key as keyof typeof codes]).toUpperCase()] = Number(key);
          return prev;
        }, {} as Record<string, number>),
    };
  }

  regist<C extends RegistApiDefinition>(apis: C): RegistApi<C> {
    return Object.keys(apis).reduce((prev, key) => {
      const doc = parser(apis[key]);
      if (doc.type === DocumentType.Query) {
        prev[key] = (options: any) => this.sentQuery({ ...options, query: apis[key] });
      } else if (doc.type === DocumentType.Mutation) {
        prev[key] = (options: any) => this.sentMutate({ ...options, mutation: apis[key] });
      } else if (doc.type === DocumentType.Subscription) {
        prev[key] = (options: any) => this.sentSubscribe({ ...options, query: apis[key] });
      } else {
        // TODO
        prev[key] = () => Promise.resolve();
      }
      return prev;
    }, {} as Record<string, any>) as RegistApi<C>;
  }

  sentQuery<TData = any, TVariables extends OperationVariables = OperationVariables, Result = TData>({
    loading = false,
    loadingText,
    catchError = false,
    onSuccess,
    onError,
    ...queryOptions
  }: RequestOptions<TData, Result> & QueryOptions<TVariables, TData>): Promise<Result> {
    const { loadingDelay, onCatch } = this.options;

    const requestPromise = this.client.query(queryOptions);

    let stopLoading: (() => void) | void;
    if (loading) {
      const delaySymbol = Symbol.for(`DELAY_${loadingDelay}`);
      const showLoadingPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(delaySymbol);
        }, loadingDelay);
      });

      Promise.race([showLoadingPromise, requestPromise]).then((delay) => {
        delay === delaySymbol && (stopLoading = this.startLoading(loading, loadingText));
      });
    }

    // 返回 promise
    return requestPromise
      .then(({ data, error, errors }) => {
        // "all" errorPolicy
        if (error || errors?.length) {
          onError?.(error ? error : new GraphQLInnerError('Check details in inner error(s)', errors!));
        }

        stopLoading?.();
        return onSuccess?.(data) ?? data;
      })
      .catch((err) => {
        stopLoading?.();
        if (catchError) {
          onCatch(err);
          return new Promise(function () {}) as any;
        } else {
          onError?.(err);
        }
        throw err;
      });
  }

  sentMutate<
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
    TContext extends Record<string, any> = DefaultContext,
    Result = TData,
  >({
    loading = false,
    loadingText,
    catchError = false,
    onSuccess,
    onError,
    ...mutationOptions
  }: RequestOptions<TData, Result> & MutationOptions<TData, TVariables, TContext>): Promise<Result> {
    const { loadingDelay, onCatch } = this.options;

    const requestPromise = this.client.mutate(mutationOptions);

    let stopLoading: (() => void) | void;
    if (loading) {
      const delaySymbol = `DELAY_${loadingDelay}`;
      const showLoadingPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(delaySymbol);
        }, loadingDelay);
      });

      Promise.race([showLoadingPromise, requestPromise]).then((delay) => {
        delay === delaySymbol && (stopLoading = this.startLoading(loading, loadingText));
      });
    }

    // 返回 promise
    return requestPromise
      .then(({ data, errors }) => {
        // "all" errorPolicy
        if (errors?.length) {
          onError?.(new GraphQLInnerError('Check details in inner error(s)', errors));
        }

        stopLoading?.();
        return onSuccess?.(data) ?? data;
      })
      .catch((err) => {
        stopLoading?.();
        if (catchError) {
          onCatch(err);
          return new Promise(function () {}) as any;
        } else {
          onError?.(err);
        }
        throw err;
      });
  }

  sentSubscribe<TData = any, TVariables extends OperationVariables = OperationVariables>({
    onData,
    onError,
    onComplete,
    ...subscribeOptions
  }: ObserverOptions<TData> & SubscriptionOptions<TVariables, TData>): () => void {
    const observer = this.client.subscribe(subscribeOptions);

    const subscription = observer.subscribe({
      next: ({ data }) => onData(data),
      error: onError,
      complete: onComplete,
    });

    return () => subscription.unsubscribe();
  }

  private startLoading(loading: boolean | LoadingProp, text?: string): (() => void) | void {
    if (typeof loading === 'function') {
      return loading(text);
    } else if (typeof loading === 'boolean' && loading === true) {
      return this.options.loading(text);
    }
    return;
  }
}