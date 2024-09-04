import { DocumentType } from '../constants';
import { parser } from './parser';

// Types
import type {
  ApolloClient,
  OperationVariables,
  QueryOptions,
  MutationOptions,
  SubscriptionOptions,
  DefaultContext,
  TypedDocumentNode,
} from '@apollo/client';
import type { GraphQLFormattedError } from 'graphql';
import type { RegistGraphql, RequestCustomConfig, ObserverOptions } from '../types';

export class GraphQLInnerError extends Error {
  graphQLErrors: ReadonlyArray<GraphQLFormattedError>;

  constructor(message: string, graphQLErrors: ReadonlyArray<GraphQLFormattedError>) {
    super(message);
    Object.setPrototypeOf(this, GraphQLInnerError.prototype);
    this.graphQLErrors = graphQLErrors;
    this.name = 'GraphQLInnerError';
  }
}

/**
 * register graphql
 * @param client ApolloClient
 * @param definition regist graphqls definition
 */
export function registGraphql<C extends Record<string, TypedDocumentNode<any, any>>>(
  client: ApolloClient<any>,
  definition: C,
): RegistGraphql<C> {
  return Object.keys(definition).reduce((prev, key) => {
    const doc = parser(definition[key]);
    if (doc.type === DocumentType.Query) {
      prev[key] = <TData = any, TVariables extends OperationVariables = OperationVariables>(
        options: RequestCustomConfig & Omit<QueryOptions<TVariables, TData>, 'query'>,
      ) =>
        client.query({ ...options, query: definition[key] }).then(({ data, error, errors }) => {
          // "all" errorPolicy
          // https://www.apollographql.com/docs/react/data/error-handling#graphql-error-policies
          if (error || errors?.length) {
            throw error ? error : new GraphQLInnerError('Check details in inner error(s)', errors!);
          }

          return data;
        });
    } else if (doc.type === DocumentType.Mutation) {
      prev[key] = <
        TData = any,
        TVariables extends OperationVariables = OperationVariables,
        TContext extends Record<string, any> = DefaultContext,
      >(
        options: RequestCustomConfig & Omit<MutationOptions<TData, TVariables, TContext>, 'mutation'>,
      ) =>
        client.mutate({ ...options, mutation: definition[key] }).then(({ data, errors }) => {
          // "all" errorPolicy
          // https://www.apollographql.com/docs/react/data/error-handling#graphql-error-policies
          if (errors?.length) {
            throw new GraphQLInnerError('Check details in inner error(s)', errors);
          }

          return data;
        });
    } else if (doc.type === DocumentType.Subscription) {
      prev[key] = <TData = any, TVariables extends OperationVariables = OperationVariables>({
        onData,
        onError,
        onComplete,
        ...subscribeOptions
      }: ObserverOptions<TData> & Omit<SubscriptionOptions<TVariables, TData>, 'query'>) => {
        const observer = client.subscribe<TData, TVariables>({
          ...subscribeOptions,
          query: definition[key],
        });

        const subscription = observer.subscribe({
          next: ({ data }) => onData(data),
          error: onError,
          complete: onComplete,
        });

        return () => subscription.unsubscribe();
      };
    } else {
      // TODO
      prev[key] = () => Promise.resolve();
    }
    return prev;
  }, {} as Record<string, any>) as RegistGraphql<C>;
}
