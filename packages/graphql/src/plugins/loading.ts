import { isPromise } from '@ace-util/core';

// Types
import type { PluginDefinition, RegistGraphql } from '../types';

interface ReturnTypeLoading {
  /**
   * show loading handler
   * @returns hide loading handler
   */
  (): () => void;
}

interface StatusTypeLoading {
  /**
   * @param loading loading status
   * @param text loading text
   */
  (loading: boolean, text?: string): void;
}

/**
 * loading handler,
 * @return unloading handler
 */
export type LoadingHandler = ReturnTypeLoading | StatusTypeLoading;

/**
 * loading options
 */
export type LoadingOptions = {
  /**
   * delay (ms)
   * @default 260
   */
  delay?: number;
  /**
   * custom loading handler
   */
  handler?: LoadingHandler;
};

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
    const text = config?.loadingText;
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

    // 转换为ReturnTypeLoading
    if (showLoading && showLoading.length > 0) {
      const setLoading = showLoading as StatusTypeLoading;
      showLoading = () => {
        setLoading(true, text);
        return () => setLoading(false);
      };
    }

    const delaySymbol = typeof Symbol === 'function' && !!Symbol.for ? Symbol('__LOADING__') : '__LOADING__';
    const delayPromise = new Promise((resolve) => setTimeout(() => resolve(delaySymbol), delay!));
    let closeLoading: (() => void) | undefined;
    // loading 设置为true 或本地定义时并且loading 函数被设置时启动
    if (!!loading && showLoading) {
      Promise.race([requestPromise, delayPromise]).then((result) => {
        result === delaySymbol && (closeLoading = (showLoading as ReturnTypeLoading)?.());
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
 * 只在regist graphqls上运行 (and 自定义条件下)
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

declare module '../types' {
  export interface RequestCustomConfig {
    /**
     * enable loading
     * or custom loading handler/options
     * @default false
     */
    loading?: boolean | LoadingHandler | Required<LoadingOptions>;
    /**
     * loading text
     */
    loadingText?: string;
  }
}
