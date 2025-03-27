import { isPromise, warn } from '@ace-util/core';
import { debug } from '../env';

// Types
import type { PluginDefinition, RegistGraphql, RequestCustomConfig } from '../types';

/**
 * retry options
 */
export type RetryOptions = {
  /**
   * max retry count
   * @default 3
   */
  maxCount?: number;
  /**
   * enabled retry delay (formula(2 ^ count - 1 / 2) * 1000 ms)
   * @default true
   */
  delay?: boolean;
  /**
   * customized retry condition
   * @default (error) => error.message === 'Network Error'
   */
  validateError?: (error: Error) => boolean;
};

export const RetryCountSymbol = '__RetryCount__';

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
  config: RequestCustomConfig | undefined,
  options: RetryOptions,
  retryRequest: (config: any) => Promise<any>,
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
        warn(!debug, `retry delay ${backOffDelay}ms`);
        setTimeout(function () {
          resolve(null);
        }, backOffDelay);
      });

      // Return the promise in which recalls axios to retry the request
      return backoff.then(function () {
        warn(!debug, `retry ${config[RetryCountSymbol]} time(s)`);
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
export function registRetry<Request extends (config: any) => any>(
  request: Request,
  options: RetryOptions,
): (config?: Parameters<Request>[0]) => ReturnType<Request> {
  const curOptions = { ...defaultOptions, ...options };

  const retryRequest = (config?: Parameters<Request>[0]) => {
    const requestPromise = request(config);
    if (!isPromise(requestPromise)) {
      return requestPromise;
    }
    return requestPromise.catch((error) => {
      return retryHandler(error, config, curOptions, retryRequest);
    });
  };

  return retryRequest;
}

/**
 * 注册重试插件
 * 只在regist graphqls上运行 (and 自定义条件下)
 * @param options 插件配置
 */
export const createRetryPlugin: PluginDefinition<RetryOptions> =
  (options = {}) =>
  ({ registGraphqls }) => {
    return Object.keys(registGraphqls).reduce((prev, key) => {
      prev[key] = registRetry(registGraphqls[key], options);
      return prev;
    }, {} as RegistGraphql);
  };

declare module '../types' {
  export interface RequestCustomConfig {
    /**
     * @internal
     */
    [RetryCountSymbol]?: number;
    /**
     * enable retry
     * or custom retry options
     * @default false
     */
    retry?: boolean | RetryOptions;
  }
}
