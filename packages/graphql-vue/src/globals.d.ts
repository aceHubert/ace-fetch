import type { ApolloClient, TypedDocumentNode } from '@apollo/client';
import type { RegistGraphql, DefaultRegistGraphqlDefinition } from '@ace-fetch/graphql';

declare module '@ace-fetch/graphql' {
  export const debug: Readonly<boolean>;
}

export {};
