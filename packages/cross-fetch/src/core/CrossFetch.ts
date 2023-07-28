import { fetch as OriginalFetch } from 'cross-fetch';

export class CrossFetch {
  fetch: typeof OriginalFetch;
  defaults: RequestInfo;

  constructor(fetch: typeof OriginalFetch, instanceConfig: RequestInfo) {
    this.fetch = fetch;
    this.defaults = instanceConfig;
  }


  request(configOrUrl: string | RequestInfo, config?: RequestInfo) {
    this.fetch(config ?? configOrUrl);
  }
}
