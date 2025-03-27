import { isPromise, warn } from '@ace-util/core';
import { debug } from '../env';

// Types
import type { PluginDefinition, RegistGraphql, RequestCustomConfig } from '../types';

/**
 * catch error options
 */
export type CatchErrorOptions = {
  /**
   * error catch handler
   */
  handler?: (error: any) => Promise<any>;
};

const defaultOptions: CatchErrorOptions = {
  handler: (error) => {
    warn(
      !debug,
      `Error is catched by default handler, Error message: ${error instanceof Error ? error.message : error}`,
    );
    return Promise.reject(error);
  },
};

function catchErrorHandler(
  error: Error,
  config: RequestCustomConfig | undefined,
  handler: CatchErrorOptions['handler'],
) {
  if (!!config?.catchError) {
    return handler?.(error);
  }

  return Promise.reject(error);
}

/**
 * regist catch error plugin on current promise request
 * @param request request promise
 * @param options catch error options
 */
export function registCatchError<Request extends (config: any) => any>(
  request: Request,
  options: CatchErrorOptions = {},
): (config?: Parameters<Request>[0]) => ReturnType<Request> {
  const curOptions = { ...defaultOptions, ...options };
  return (config) => {
    const requestPromise = request(config);
    if (!isPromise(requestPromise)) {
      return requestPromise;
    }
    return requestPromise.catch((error) => {
      // TIP: catch 参捕获到 then 中抛出的异常
      return catchErrorHandler(error, config, curOptions.handler);
    });
  };
}

/**
 * 注册异常处理插件
 * 只在regist graphqls上运行 (and 自定义条件下)
 * @param options 插件配置
 */
export const createCatchErrorPlugin: PluginDefinition<CatchErrorOptions> =
  (options = {}) =>
  ({ registGraphqls }) => {
    return Object.keys(registGraphqls).reduce((prev, key) => {
      prev[key] = registCatchError(registGraphqls[key], options);
      return prev;
    }, {} as RegistGraphql);
  };

declare module '../types' {
  export interface RequestCustomConfig {
    /**
     * enable catch error
     * or catch error by Promise.catch locally
     * @default false
     */
    catchError?: boolean;
  }
}
