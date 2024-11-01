import { promisify, warn } from '@ace-util/core';
import { debug } from '../env';

// Types
import type { PluginDefinition, RegistApi, Request, RequestCustomConfig } from '../types';

/**
 * catch error options
 */
export type CatchErrorOptions = {
  /**
   * when error in response.body
   * throw error to handler with `Promise.reject(error)`
   * @deprecated axios use interceptors.response.use to change response type would cause an error, use `serializerResponse` instead.
   */
  serializerData?: <T = any, R = T>(data: T) => R | Promise<R>;
  /**
   * when error in response.body, example: {code: 0, message: 'error message'}
   * throw error to handler with `Promise.reject(error)`
   * @param response
   * @returns
   */
  serializerResponse?: <T = any, R = T>(response: T) => R | Promise<R>;
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
export function registCatchError(request: Request, options: CatchErrorOptions = {}): Request {
  const curOptions = { ...defaultOptions, ...options };
  return (config) =>
    request(config)
      .then(async (response) => {
        if (curOptions.serializerResponse) {
          return promisify(curOptions.serializerResponse(response));
        }

        if (curOptions.serializerData) {
          warn(false, 'serializerData is deprecated, please use serializerResponse instead');
          const data = await promisify(curOptions.serializerData(response.data));
          response.data = data;
          return response;
        }

        return response;
      })
      .catch((error) => {
        // TIP: catch 参捕获到 then 中抛出的异常
        return catchErrorHandler(error, config, curOptions.handler);
      });
}

/**
 * 注册异常处理插件
 * 只在regist apis上运行 (and 自定义条件下)
 * @param options 插件配置
 */
export const createCatchErrorPlugin: PluginDefinition<CatchErrorOptions> =
  (options = {}) =>
  ({ registApis }) => {
    return Object.keys(registApis).reduce((prev, key) => {
      prev[key] = registCatchError(registApis[key], options);
      return prev;
    }, {} as RegistApi);
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
