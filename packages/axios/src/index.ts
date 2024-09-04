import { warn } from '@ace-util/core';
import { version as coreVersion } from '@ace-fetch/core';
import { version } from './version';

warn(coreVersion === version, `"@ace-fetch/core" version mismatch, expected ${version} but ${coreVersion}!`);

export { version };
export * from './core';
export * from './types';

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
