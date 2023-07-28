import { registLoading } from '../core';

// Types
import type { RequestConfig, FetchPromise } from '@ace-fetch/core';
import type { LoadingOptions, PluginDefinition } from '../types';

/**
 * 注入加载中插件
 * 只在regist apis上运行 (and 自定义条件下)
 * @param options 插件配置
 */
export const createLoadingPlugin: PluginDefinition<LoadingOptions> = (options = {}) => ({ registApis }) => {
  return Object.keys(registApis).reduce((prev, key) => {
    prev[key] = registLoading(registApis[key], options);
    return prev;
  }, {} as Record<string, (config?: Partial<RequestConfig>) => FetchPromise<any>>);
};
