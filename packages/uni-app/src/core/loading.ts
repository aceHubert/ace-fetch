// Types
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { LoadingHandler, LoadingOptions } from '../types';

export const StopLoadingFnSymbol = '__StopLoading__';
export const ResponseFinishedSymbol = '__LoadingResponseFinished__';

const defaultOptions: LoadingOptions = {
  delay: 260,
  handler: undefined,
};

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
