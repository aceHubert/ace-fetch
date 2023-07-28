import warning from 'warning';
import axios from 'axios';
import { debug } from '../env';

// Types
import type { AxiosInstance } from 'axios';
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { CatchErrorOptions } from '../types';

const defaultOptions: CatchErrorOptions = {
  handler: (error) => {
    warning(
      !debug,
      `Error is catched by default handler, Error message: ${error instanceof Error ? error.message : error}`,
    );
    return Promise.reject(error);
  },
};

const isAxiosError = axios.isAxiosError;
const isCancelError = axios.isCancel;

function catchErrorHandler(error: Error, config: RequestConfig | undefined, handler: CatchErrorOptions['handler']) {
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
 * use axios.interceptors to catch errors.
 * do not change the return type from interceptors
 * with "AxiosResponse" ans "AxiosError", next handler functions need it
 * @param axiosInstance axios instance
 * @param options catch error options
 */
export function applyCatchError(axiosInstance: AxiosInstance, options: CatchErrorOptions = {}) {
  const curOptions = { ...defaultOptions, ...options };
  axiosInstance.interceptors.request.use(undefined, (error) => {
    if (!isAxiosError(error)) {
      warning(!debug, `catchError needs "AxiosError.config", please do not chage format from interceptors return!`);
      return Promise.reject(error);
    } else if (isCancelError(error)) {
      warning(!debug, `catchError won't handle axios cancel error!`);
      return Promise.reject(error);
    }

    warning(
      !debug && !!error.config,
      `catchError needs "AxiosError.config", it will throw error in production!
      `,
    );

    return catchErrorHandler(error, error.config, curOptions.handler);
  });
  axiosInstance.interceptors.response.use(
    (response) => {
      if (!response?.config) {
        warning(!debug, `catchError needs "response.config", please do not chage format from interceptors return! `);
        return response;
      }

      if (curOptions.serializerData) {
        return promisify(curOptions.serializerData(response.data))
          .then((data) => {
            response.data = data;
            return response;
          })
          .catch((error) => {
            if (isAxiosError(error)) {
              return Promise.reject(error);
            } else {
              // error 中 需要 config 依赖
              return Promise.reject(
                new axios.AxiosError(
                  error instanceof Error ? error.message : error,
                  error?.code || 'FROM_SERIALIZER_DATA_ERROR',
                  response.config,
                  response.request,
                  response,
                ),
              );
            }
          });
      }

      return response;
    },
    (error) => {
      if (!isAxiosError(error)) {
        warning(!debug, `catchError needs "AxiosError.config", please do not chage format from interceptors return!`);
        return Promise.reject(error);
      } else if (isCancelError(error)) {
        warning(!debug, `catchError won't handle axios cancel error!`);
        return Promise.reject(error);
      }

      debug &&
        warning(
          !!error.config,
          `catchError needs "AxiosError.config", it will throw error in production!
        `,
        );

      return catchErrorHandler(error, error.config, curOptions.handler);
    },
  );
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

/**
 * @internal
 */
declare module 'axios' {
  export interface AxiosStatic {
    AxiosError: typeof AxiosError;
  }
}
