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
export * from './chat-messages';
