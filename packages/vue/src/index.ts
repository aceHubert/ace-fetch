import { warn } from '@ace-util/core';
import { version as coreVersion } from '@ace-fetch/core';
import { version } from './version';

warn(coreVersion === version, `"@ace-fetch/core" version mismatch, expected ${version} but ${coreVersion}!`);

export { version };
export * from './core';
export * from './types';
