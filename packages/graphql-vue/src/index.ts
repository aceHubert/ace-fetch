import { warn } from '@ace-util/core';
import { version as coreVersion } from '@ace-fetch/graphql';
import { version } from './version';

let coreVersionArr = coreVersion.split('.'),
  versionArr = version.split('.').slice(0, 1); // version without patch
warn(
  versionArr.every((v, i) => v === coreVersionArr[i]),
  `"@ace-fetch/graphql" version mismatch, expected ${versionArr.join('.')}.x but ${coreVersion}!`,
);

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
