import { isPromise } from '@ace-util/core';

// Types
import type { PluginDefinition, RegistGraphql, LoadingOptions } from '../types';

const defaultOptions: LoadingOptions = {
  delay: 260,
  handler: undefined,
};

/**
 * regist loading plugin on current promise request
 * @param request request promise
 * @param options catch error options
 */
export function registLoading<Request extends (config: any) => any>(
  request: Request,
  options: LoadingOptions,
): (config: Parameters<Request>[0]) => ReturnType<Request> {
  const curOptions = { ...defaultOptions, ...options };
  return (config) => {
    const requestPromise = request(config);
    if (!isPromise(requestPromise)) {
      return requestPromise;
    }

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
        throw error;
      });
  };
}

/**
 * 注入加载中插件
 * 只在regist apis上运行 (and 自定义条件下)
 * @param options 插件配置
 */
export const createLoadingPlugin: PluginDefinition<LoadingOptions> =
  (options = {}) =>
  ({ registGraphqls }) => {
    return Object.keys(registGraphqls).reduce((prev, key) => {
      prev[key] = registLoading(registGraphqls[key], options);
      return prev;
    }, {} as RegistGraphql);
  };
