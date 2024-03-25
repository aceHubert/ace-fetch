import { warn } from '@ace-util/core';
import { debug } from '../env';

// Types
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { CatchErrorOptions } from '../types';

const defaultOptions: CatchErrorOptions = {
  handler: (error) => {
    warn(
      !debug,
      `Error is catched by default handler, Error message: ${error instanceof Error ? error.message : error}`,
    );
    return Promise.reject(error);
  },
};

function catchErrorHandler(
  error: Error,
  config: Partial<RequestConfig> | undefined,
  handler: CatchErrorOptions['handler'],
) {
  if (!!config?.catchError) {
    return handler?.(error);
  }

  return Promise.reject(error);
}

function promisify<T>(promise: T | PromiseLike<T>): Promise<T> {
  if (promise && promise instanceof Promise && typeof promise.then === 'function') {
    return promise;
  }
  return Promise.resolve(promise);
}

/**
 * regist catch error plugin on current promise request
 * @param request request promise
 * @param options catch error options
 */
export function registCatchError<Request extends (config: any) => FetchPromise<any>>(
  request: Request,
  options: CatchErrorOptions = {},
): (config?: Partial<RequestConfig>) => FetchPromise<any> {
  const curOptions = { ...defaultOptions, ...options };
  return (config) =>
    request(config)
      .then(async (response) => {
        if (curOptions.serializerData) {
          const data = await promisify(curOptions.serializerData(response.data));
          response.data = data as any;
        }
        return response;
      })
      .catch((error) => {
        // TIP: catch 参捕获到 then 中抛出的异常
        return catchErrorHandler(error, config, curOptions.handler);
      });
}
