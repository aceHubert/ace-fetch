import { registCatchError } from '../core';

// Types
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { CatchErrorOptions, PluginDefinition } from '../types';

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
    }, {} as Record<string, (config?: Partial<RequestConfig>) => FetchPromise<any>>);
  };
