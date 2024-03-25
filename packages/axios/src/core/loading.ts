import { warn } from '@ace-util/core';
import axios from 'axios';
import { debug } from '../env';

// Types
import type { AxiosInstance } from 'axios';
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { LoadingHandler, LoadingOptions } from '../types';

export const StopLoadingFnSymbol = '__StopLoading__';
export const ResponseFinishedSymbol = '__LoadingResponseFinished__';

const defaultOptions: LoadingOptions = {
  delay: 260,
  handler: undefined,
};

function startLoading(config: RequestConfig, handler: LoadingHandler, delay: number) {
  if (delay > 0) {
    // delay
    setTimeout(() => {
      // response 已经返回， handler 不执行
      config[StopLoadingFnSymbol] !== ResponseFinishedSymbol && (config[StopLoadingFnSymbol] = handler());
    }, delay);
  } else {
    config[StopLoadingFnSymbol] = handler();
  }
}

function stopLoading(config: RequestConfig) {
  const { [StopLoadingFnSymbol]: stopLoadingFnOrSymbol } = config;
  // 设置 response 已结束， delay 将不再执行 handler
  config[StopLoadingFnSymbol] = ResponseFinishedSymbol;
  stopLoadingFnOrSymbol && stopLoadingFnOrSymbol !== ResponseFinishedSymbol && stopLoadingFnOrSymbol();
}

const isAxiosError = axios.isAxiosError;
const isCancelError = axios.isCancel;

/**
 * use axios.interceptors to register loading function.
 * do not change the return type from interceptors
 * with "AxiosResponse" ans "AxiosError", next handler functions need it
 * @param axiosInstance axios instance
 * @param options loading options
 */
export function applyLoading(axiosInstance: AxiosInstance, options: LoadingOptions) {
  const curOptions = { ...defaultOptions, ...options };

  axiosInstance.interceptors.request.use((config) => {
    const { loading } = config as RequestConfig;
    let delay = curOptions.delay || 0;
    let loadingFn = curOptions.handler;
    // 如果有本地设置
    if (loading && typeof loading !== 'boolean') {
      if (typeof loading === 'function') {
        loadingFn = loading;
      } else {
        loading.delay !== void 0 && (delay = loading.delay);
        loadingFn = loading.handler;
      }
    }
    // loading 设置为true 或本地定义时并且loading 函数被设置时启动
    if (!!loading && loadingFn) {
      startLoading(config, loadingFn, delay);
    }
    return config;
  }, undefined);
  axiosInstance.interceptors.response.use(
    (response) => {
      if (!response?.config) {
        warn(!debug, `loading needs "response.config", please do not chage format from interceptors return! `);
        return response;
      }

      stopLoading(response.config);

      return response;
    },
    (error) => {
      if (!isAxiosError(error)) {
        warn(!debug, `loading needs "AxiosError.config", please do not chage format from interceptors return!`);
        return Promise.reject(error);
      } else if (isCancelError(error)) {
        warn(!debug, `loading won't handle axios cancel error!`);
        return Promise.reject(error);
      }

      debug &&
        warn(
          !!error.config,
          `loading needs "AxiosError.config", it will throw error in production!
        `,
        );

      stopLoading(error.config);

      return Promise.reject(error);
    },
  );
}

/**
 * regist loading plugin on current promise request
 * @param request request promise
 * @param options catch error options
 */
export function registLoading<Request extends (config: any) => FetchPromise<any>>(
  request: Request,
  options: LoadingOptions,
): (config?: Partial<RequestConfig>) => FetchPromise<any> {
  const curOptions = { ...defaultOptions, ...options };
  return (config) => {
    const loading = config?.loading;
    let delay = curOptions.delay || 0;
    let showLoading = curOptions.handler;
    // 如果有本地设置
    if (loading && typeof loading !== 'boolean') {
      if (typeof loading === 'function') {
        showLoading = loading;
      } else {
        loading.delay !== void 0 && (delay = loading.delay);
        showLoading = loading.handler;
      }
    }
    const requestPromise = request(config);
    const delaySymbol = typeof Symbol === 'function' && !!Symbol.for ? Symbol('__LOADING__') : '__LOADING__';
    const delayPromise = new Promise((resolve) => setTimeout(() => resolve(delaySymbol), delay!));
    let closeLoading: (() => void) | undefined;
    // loading 设置为true 或本地定义时并且loading 函数被设置时启动
    if (!!loading && showLoading) {
      Promise.race([requestPromise, delayPromise]).then((result) => {
        result === delaySymbol && (closeLoading = showLoading?.());
      });
    }
    return requestPromise
      .then((response) => {
        closeLoading?.();
        return response;
      })
      .catch((error) => {
        closeLoading?.();
        return Promise.reject(error);
      });
  };
}

/**
 * @internal
 */
declare module '@ace-fetch/core' {
  interface RequestConfig {
    [StopLoadingFnSymbol]?: typeof ResponseFinishedSymbol | ReturnType<LoadingHandler>;
  }
}
