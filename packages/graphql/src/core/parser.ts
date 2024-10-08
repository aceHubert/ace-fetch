/**
 * fork from https://github.com/apollographql/apollo-client/blob/main/src/react/parser/index.ts
 * for using without react
 */
import { invariant } from 'ts-invariant';
import { DocumentType } from '../constants';

// Types
import type { DocumentNode, DefinitionNode, OperationDefinitionNode } from 'graphql';
import type { IDocumentDefinition } from '../types';

const cache = new WeakMap();

export function operationName(type: DocumentType) {
  let name;
  switch (type) {
    case DocumentType.Query:
      name = 'Query';
      break;
    case DocumentType.Mutation:
      name = 'Mutation';
      break;
    case DocumentType.Subscription:
      name = 'Subscription';
      break;
  }
  return name;
}

// This parser is mostly used to safety check incoming documents.
export function parser(document: DocumentNode): IDocumentDefinition {
  const cached = cache.get(document);
  if (cached) return cached;

  let variables, type, name;

  invariant(
    !!document && !!document.kind,
    `Argument of ${document} passed to parser was not a valid GraphQL ` +
      `DocumentNode. You may need to use 'graphql-tag' or another method ` +
      `to convert your operation into a document`,
  );

  const fragments: DefinitionNode[] = [];
  const queries: DefinitionNode[] = [];
  const mutations: DefinitionNode[] = [];
  const subscriptions: DefinitionNode[] = [];

  for (const x of document.definitions) {
    if (x.kind === 'FragmentDefinition') {
      fragments.push(x);
      continue;
    }

    if (x.kind === 'OperationDefinition') {
      switch (x.operation) {
        case 'query':
          queries.push(x);
          break;
        case 'mutation':
          mutations.push(x);
          break;
        case 'subscription':
          subscriptions.push(x);
          break;
      }
    }
  }

  invariant(
    !fragments.length || queries.length || mutations.length || subscriptions.length,
    `Passing only a fragment to 'graphql' is not yet supported. ` +
      `You must include a query, subscription or mutation as well`,
  );

  invariant(
    queries.length + mutations.length + subscriptions.length <= 1,
    `react-apollo only supports a query, subscription, or a mutation per HOC. ` +
      `${document} had ${queries.length} queries, ${subscriptions.length} ` +
      `subscriptions and ${mutations.length} mutations. ` +
      `You can use 'compose' to join multiple operation types to a component`,
  );

  type = queries.length ? DocumentType.Query : DocumentType.Mutation;
  if (!queries.length && !mutations.length) type = DocumentType.Subscription;

  const definitions = queries.length ? queries : mutations.length ? mutations : subscriptions;

  invariant(
    definitions.length === 1,
    `react-apollo only supports one definition per HOC. ${document} had ` +
      `${definitions.length} definitions. ` +
      `You can use 'compose' to join multiple operation types to a component`,
  );

  const definition = definitions[0] as OperationDefinitionNode;
  // eslint-disable-next-line prefer-const
  variables = definition.variableDefinitions || [];

  if (definition.name && definition.name.kind === 'Name') {
    name = definition.name.value;
  } else {
    name = 'data'; // fallback to using data if no name
  }

  const payload = { name, type, variables };
  cache.set(document, payload);
  return payload;
}

export function verifyDocumentType(document: DocumentNode, type: DocumentType) {
  const operation = parser(document);
  const requiredOperationName = operationName(type);
  const usedOperationName = operationName(operation.type);
  invariant(
    operation.type === type,
    `Running a ${requiredOperationName} requires a graphql ` +
      `${requiredOperationName}, but a ${usedOperationName} was used instead.`,
  );
}
