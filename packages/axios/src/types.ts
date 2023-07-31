import type { AxiosRequestConfig } from 'axios';
import type { RegistApi, MethodUrl } from '@ace-fetch/core';

declare module '@ace-fetch/core' {
  export interface RequestConfig<D = any> extends AxiosRequestConfig<D> {
    /**
     * enable catch error
     * or catch error by Promise.catch locally
     * @default false
     */
    catchError?: boolean;

    /**
     * enable loading
     * or custom loading handler/options
     * @default false
     */
    loading?: boolean | LoadingHandler | Required<LoadingOptions>;
    /**
     * enable retry
     * or custom retry options
     * @default false
     */
    retry?: boolean | RetryOptions;
  }
}

/**
 * catch error options
 */
export type CatchErrorOptions = {
  /**
   * when error in response.body
   * throw error to handler with `Promise.reject(error)`
   */
  serializerData?: <T = any, R = T>(data: T) => R | Promise<R>;
  /**
   * error catch handler
   */
  handler?: (error: any) => Promise<any>;
};

/**
 * loading handler,
 * @return unloading handler
 */
export type LoadingHandler = () => () => void;

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

/**
 * retry options
 */
export type RetryOptions = {
  /**
   * max retry count
   * @default 3
   */
  maxCount?: number;
  /**
   * enabled retry delay (formula(2 ^ count - 1 / 2) * 1000 ms)
   * @default true
   */
  delay?: boolean;
  /**
   * customized retry condition
   * @default (error) => error.message === 'Network Error'
   */
  validateError?: (error: Error) => boolean;
};

/**
 * plugin options
 */
type OptionsInPlugin<O extends Record<string, any>> = {
  /**
   * 插件执行的条件，默认是在所有通过 'defineRegistApi()' 的方法执行,
   * 可以以上条件上追加条件，如在某个前缀上执行等。
   */
  // runWhen?: (config: AxiosRequestConfig) => boolean;
} & O;

export interface RegisterPluginContext<C extends Record<string, MethodUrl> = any> {
  /**
   * regist api
   */
  registApis: RegistApi<C>;
}

/**
 * plugin definition for package '@ace-fetch/core'
 */
export interface PluginDefinition<O extends Record<string, any>> {
  (options?: OptionsInPlugin<O>): (context: RegisterPluginContext) => any;
}
