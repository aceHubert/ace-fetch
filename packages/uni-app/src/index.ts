import { warn } from '@ace-util/core';
import { version as coreVersion } from '@ace-fetch/core';
import { version } from './version';

let coreVersionArr = coreVersion.split('.'),
  versionArr = version.split('.').slice(0, 1); // version without patch
warn(
  versionArr.every((v, i) => v === coreVersionArr[i]),
  `"@ace-fetch/core" version mismatch, expected ${versionArr.join('.')}.x but ${coreVersion}!`,
);

export { version };
export * from './core';

export {
  /**
   * @deprecated Use `registCatchError` from `@ace-fetch/core` instead.
   */
  registCatchError,
  /**
   * @deprecated Use `createCatchErrorPlugin` from `@ace-fetch/core` instead.
   */
  createCatchErrorPlugin,
  /**
   * @deprecated Use `registLoading` from `@ace-fetch/core
   */
  registLoading,
  /**
   * @deprecated Use `createLoadingPlugin` from `@ace-fetch/core` instead.
   */
  createLoadingPlugin,
  /**
   * @deprecated Use `registRetry` from `@ace-fetch/core` instead.
   */
  registRetry,
  /**
   * @deprecated Use `createRetryPlugin` from `@ace-fetch/core` instead.
   */
  createRetryPlugin,
} from '@ace-fetch/core';
