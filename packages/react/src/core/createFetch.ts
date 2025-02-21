// Types
import type { FetchClient, RegistApi } from '@ace-fetch/core';
import type { Fetch } from '../types';

export function createFetch(client: FetchClient): Fetch {
  const _p: Fetch['_p'] = [];

  const fetch: Fetch = {
    use(plugin) {
      _p.push(plugin);

      return this;
    },
    // store regist apis
    _r: new Map<string, RegistApi<any>>(),
    // regist api plugins
    _p,
    client,
  };

  return fetch;
}
