import { warn } from '@ace-util/core';
import { debug } from '@ace-fetch/core';
import axios from 'axios';

// Types
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { LoadingHandler, LoadingOptions } from '@ace-fetch/core';

export const StopLoadingFnSymbol = '__StopLoading__';
export const ResponseFinishedSymbol = '__LoadingResponseFinished__';

const defaultOptions: LoadingOptions = {
  delay: 260,
  handler: undefined,
};

function startLoading(
  config: AxiosRequestConfig,
  handler: LoadingHandler,
  loadingText: string | undefined,
  delay: number,
) {
  let showLoading: () => () => void;
  if (handler.length > 0) {
    const setLoading = handler;
    showLoading = () => {
      setLoading(true, loadingText);
      return () => setLoading(false);
    };
  } else {
    showLoading = handler as () => () => void;
  }

  if (delay > 0) {
    // delay
    setTimeout(() => {
      // response 已经返回， handler 不执行
      config[StopLoadingFnSymbol] !== ResponseFinishedSymbol && (config[StopLoadingFnSymbol] = showLoading());
    }, delay);
  } else {
    config[StopLoadingFnSymbol] = showLoading();
  }
}

function stopLoading(config: AxiosRequestConfig) {
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
    const { loading, loadingText } = config;
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
    // loading 设置为true 或本地定义时并且loading 函数被设置时启动
    if (!!loading && showLoading) {
      startLoading(config, showLoading, loadingText, delay);
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
      if (isCancelError(error)) {
        warn(!debug, `loading won't handle axios cancel error!`);
        return Promise.reject(error);
      } else if (!isAxiosError(error)) {
        warn(!debug, `loading needs "AxiosError.config", please do not chage format from interceptors return!`);
        return Promise.reject(error);
      }

      debug &&
        warn(
          !!error.config,
          `loading needs "AxiosError.config", it will throw error in production!
        `,
        );

      stopLoading(error.config!);

      return Promise.reject(error);
    },
  );
}

/**
 * @internal
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    [StopLoadingFnSymbol]?: typeof ResponseFinishedSymbol | ReturnType<LoadingHandler>;
  }
}
