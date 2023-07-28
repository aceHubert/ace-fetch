import { fetch } from 'cross-fetch';

fetch.prototype.request = function () {};

// function createInstance(Fetch: typeof CrossFetch, defaultConfig: RequestInfo) {
//   // const context = new Fetch(defaultConfig);
//   // const instance = bind(Axios.prototype.request, context);

//   // // Copy cross-fetch.prototype to instance
//   // utils.extend(instance, Axios.prototype, context);

//   // // Copy context to instance
//   // utils.extend(instance, context);

//   // return instance;
// }

export function crossFetchAdapter(Fetch: typeof fetch): typeof fetch {
  const fetch = Fetch as any;

  ['delete', 'get', 'head', 'options'].forEach((method) => {
    fetch[method] = function (url: string, config?: RequestInfo) {
      Fetch(Object.assign({}, config, { url, method }));
    };
  });

  ['post', 'put', 'patch'].forEach((method) => {
    fetch[method] = function (url: string, config?: RequestInfo) {
      Fetch(Object.assign({}, config, { url, method }));
    };
  });

  return fetch;
}
