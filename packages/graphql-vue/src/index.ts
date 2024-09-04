import { warn } from '@ace-util/core';
import { version as coreVersion } from '@ace-fetch/graphql';
import { version } from './version';

warn(coreVersion === version, `"@ace-fetch/graphql" version mismatch, expected ${version} but ${coreVersion}!`);

export { version };
export * from './core';
export * from './types';
export {
  gql,
  resetCaches,
  disableFragmentWarnings,
  enableExperimentalFragmentVariables,
  disableExperimentalFragmentVariables,
} from 'graphql-tag';
