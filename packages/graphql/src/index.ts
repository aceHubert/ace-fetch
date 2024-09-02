export * from './core';
export * from './fetchs';
/**
 * @internal
 */
export { debug } from './env';
export { setDebug } from './env';
export { version } from './version';
export {
  gql,
  resetCaches,
  disableFragmentWarnings,
  enableExperimentalFragmentVariables,
  disableExperimentalFragmentVariables,
} from 'graphql-tag';
