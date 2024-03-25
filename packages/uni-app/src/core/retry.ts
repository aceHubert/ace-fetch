import { warn } from '@ace-util/core';
import { debug } from '../env';

// Types
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { RetryOptions } from '../types';

export const RetryCountSymbol = Symbol('__RetryCount__');

const defaultOptions: RetryOptions = {
  maxCount: 3,
  delay: true,
  /**
   * The request was made but no response was received
   * `error.request` is an instance of XMLHttpRequest in the browser and an instance of
   * http.ClientRequest in node.js
   */
  validateError: (error) => error.message === 'Network Error',
};

function retryHandler(
  error: Error,
  config: Partial<RequestConfig> | undefined,
  options: RetryOptions,
  retryRequest: (config: any) => FetchPromise,
) {
  if (!!config?.retry) {
    const curOptions = typeof config.retry === 'boolean' ? options : { ...options, ...config.retry };
    if (!curOptions.validateError!(error)) return Promise.reject(error);

    // Set the variable for keeping track of the retry count
    config[RetryCountSymbol] = config[RetryCountSymbol] || 0;

    // Check if we've maxed out the total number of retries
    if (config[RetryCountSymbol]! < curOptions.maxCount!) {
      // Increase the retry count
      config[RetryCountSymbol]! += 1;

      // Create new promise to handle exponential backoff.
      // formula(2 ^ c - 1 / 2) * 1000(for mS to seconds)
      const backoff = new Promise(function (resolve) {
        const backOffDelay = curOptions.delay ? (1 / 2) * (Math.pow(2, config[RetryCountSymbol]!) - 1) * 1000 : 1;
        warn(!debug, `${config.url!}: retry delay ${backOffDelay}ms`);
        setTimeout(function () {
          resolve(null);
        }, backOffDelay);
      });

      // Return the promise in which recalls uni to retry the request
      return backoff.then(function () {
        warn(!debug, `${config.url}: retry ${config[RetryCountSymbol]} time(s)`);
        return retryRequest(config);
      });
    }
  }

  return Promise.reject(error);
}

/**
 * regist retry plugin on current promise request
 * @param request request promise
 * @param options catch error options
 */
export function registRetry<Request extends (config: any) => FetchPromise<any>>(
  request: Request,
  options: RetryOptions,
): (config?: Partial<RequestConfig>) => FetchPromise<any> {
  const retryRequest = (config?: Partial<RequestConfig>) => {
    const curOptions = { ...defaultOptions, ...options };
    return request(config).catch((error) => {
      return retryHandler(error, config, curOptions, retryRequest);
    });
  };

  return retryRequest;
}

/**
 * @internal
 */
declare module '@ace-fetch/core' {
  interface RequestConfig {
    [RetryCountSymbol]?: number;
  }
}
