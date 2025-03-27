import { promisify, warn } from '@ace-util/core';
import { debug } from '@ace-fetch/core';
import axios from 'axios';

// Types
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { CatchErrorOptions } from '@ace-fetch/core';

const defaultOptions: CatchErrorOptions = {
  handler: (error) => {
    warn(
      !debug,
      `Error is catched by default handler, Error message: ${error instanceof Error ? error.message : error}`,
    );
    return Promise.reject(error);
  },
};

const isAxiosError = axios.isAxiosError;
const isCancelError = axios.isCancel;

function catchErrorHandler(
  error: Error,
  config: AxiosRequestConfig | undefined,
  handler: CatchErrorOptions['handler'],
) {
  if (!!config?.catchError) {
    return handler?.(error);
  }

  return Promise.reject(error);
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
    if (isCancelError(error)) {
      warn(!debug, `catchError won't handle axios cancel error!`);
      return Promise.reject(error);
    } else if (!isAxiosError(error)) {
      warn(!debug, `catchError needs "AxiosError.config", please do not chage format from interceptors return!`);
      return Promise.reject(error);
    }

    warn(
      !debug && !!error.config,
      `catchError needs "AxiosError.config", it will throw error in production!
      `,
    );

    return catchErrorHandler(error, error.config, curOptions.handler);
  });
  axiosInstance.interceptors.response.use(
    (response) => {
      if (!response?.config) {
        warn(!debug, `catchError needs "response.config", please do not chage format from interceptors return! `);
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
      if (isCancelError(error)) {
        warn(!debug, `catchError won't handle axios cancel error!`);
        return Promise.reject(error);
      } else if (!isAxiosError(error)) {
        warn(!debug, `catchError needs "AxiosError.config", please do not chage format from interceptors return!`);
        return Promise.reject(error);
      }

      debug &&
        warn(
          !!error.config,
          `catchError needs "AxiosError.config", it will throw error in production!
        `,
        );

      return catchErrorHandler(error, error.config, curOptions.handler);
    },
  );
}

/**
 * @internal
 */
declare module 'axios' {
  interface AxiosStatic {
    AxiosError: typeof AxiosError;
  }
}
