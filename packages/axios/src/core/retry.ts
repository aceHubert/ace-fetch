import warning from 'warning';
import axios from 'axios';
import { debug } from '../env';

// Types
import type { AxiosInstance } from 'axios';
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { RetryOptions } from '../types';

// axios mergeConig does not support Symbol (Object.keys())
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

const isAxiosError = axios.isAxiosError;
const isCancelError = axios.isCancel;

function retryHandler(
  error: Error,
  config: RequestConfig | undefined,
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
        warning(!debug, `${config.url}: retry delay ${backOffDelay}ms`);
        setTimeout(function () {
          resolve(null);
        }, backOffDelay);
      });

      // Return the promise in which recalls axios to retry the request
      return backoff.then(function () {
        warning(!debug, `${config.url}: retry ${config[RetryCountSymbol]} time(s)`);
        return retryRequest(config);
      });
    }
  }

  return Promise.reject(error);
}

/**
 * use axios.interceptors to register retry function.
 * do not change the return type from interceptors
 * with "AxiosResponse" ans "AxiosError", next handler functions need it
 * @param axiosInstance axios instance
 * @param options retry options
 */
export function applyRetry(axiosInstance: AxiosInstance, options: RetryOptions) {
  const curOptions = { ...defaultOptions, ...options };
  axiosInstance.interceptors.request.use(undefined, (error) => {
    if (!isAxiosError(error)) {
      warning(!debug, `retry needs "AxiosError.config", please do not chage format from interceptors return!`);
      return Promise.reject(error);
    } else if (isCancelError(error)) {
      warning(!debug, `retry won't handle axios cancel error!`);
      return Promise.reject(error);
    }

    warning(
      !debug && !!error.config,
      `retry needs "AxiosError.config", it will throw error in production!
      `,
    );

    return retryHandler(error, error.config, curOptions, axios);
  });
  axiosInstance.interceptors.response.use(undefined, (error) => {
    if (!isAxiosError(error)) {
      warning(!debug, `retry needs "AxiosError.config", please do not chage format from interceptors return!`);
      return Promise.reject(error);
    } else if (isCancelError(error)) {
      warning(!debug, `retry won't handle axios cancel error!`);
      return Promise.reject(error);
    }

    debug &&
      warning(
        !!error.config,
        `retry needs "AxiosError.config", it will throw error in production!
      `,
      );

    return retryHandler(error, error.config, curOptions, axios);
  });
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
  export interface RequestConfig {
    [RetryCountSymbol]?: number;
  }
}
