export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK';

/**
 * preset content-type headers
 * json: application/json;charset=utf-8
 * form: application/x-www-form-urlencoded
 */
export type RequestType = 'json' | 'form';

/**
 * request config
 */
export interface RequestConfig<D = any> {
  url?: string;
  method?: Method | string;
  headers?: any;
  params?: any;
  data?: D;
  requestType?: RequestType;
}

/**
 * response
 */
export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: RequestConfig;
  request?: any;
}

/**
 * fetch promise
 */
export interface FetchPromise<T = any> extends Promise<Response<T>> {}

/**
 * fetch client
 */
export interface FetchClient {
  request<T = any, R = Response<T>>(config: RequestConfig): Promise<R>;
  get<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R>;
  delete<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R>;
  head<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R>;
  options<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R>;
  post<T = any, R = Response<T>>(url: string, data?: any, config?: RequestConfig): Promise<R>;
  put<T = any, R = Response<T>>(url: string, data?: any, config?: RequestConfig): Promise<R>;
  patch<T = any, R = Response<T>>(url: string, data?: any, config?: RequestConfig): Promise<R>;
}

/**
 * method url definition
 */
export type MethodUrl = string | MethodUrlWithConfig | MethodUrlFn;
/**
 * method url definition with local config
 */
export type MethodUrlWithConfig = [Partial<RequestConfig>, string];
/**
 * functional method url definition
 */
export type MethodUrlFn<R = any, P = any, D = any> = (params: P) => string | MethodUrlWithConfig;

/**
 * type isNever = CheckNever<any> => 'no'
 * type isNever = CheckNever<never> => 'yes'
 */
type CheckNever<T> = T extends never ? 'yes' : 'no';
/**
 * type isAny = CheckAny<any> => 'yes'
 * type isAny = CheckAny<never> => 'no'
 */
type CheckAny<T> = CheckNever<T> extends 'no' ? 'no' : 'yes';

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

export interface RequestCustomConfig {
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
   * loading text
   */
  loadingText?: string;
  /**
   * enable retry
   * or custom retry options
   * @default false
   */
  retry?: boolean | RetryOptions;
}

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

export interface RegisterPluginContext<C extends Record<string, MethodUrl> = Record<string, MethodUrl>> {
  /**
   * regist api
   */
  registApis: RegistApi<C>;
}

/**
 * Custom registApis properties extends from plugin
 */
export interface RegistApiCustomProperties<C extends Record<string, MethodUrl> = Record<string, MethodUrl>> {}

/**
 * plugin definition
 */
export interface PluginDefinition<
  O extends Record<string, any>,
  C extends Record<string, MethodUrl> = Record<string, MethodUrl>,
> {
  (options?: OptionsInPlugin<O>): (context: RegisterPluginContext<C>) => RegistApi<C> & RegistApiCustomProperties<C>;
}

/**
 * method url transfor to request definition
 */
export type RequestDefinition<MethodUrl> = MethodUrl extends MethodUrlFn<infer Result, infer Params, infer Data>
  ? CheckAny<Params> extends 'yes'
    ? (
        config?: RequestCustomConfig &
          Partial<Omit<RequestConfig, 'params' | 'data'> & { params?: Params; data?: Data }>,
      ) => FetchPromise<Result>
    : (
        config: RequestCustomConfig & Partial<Omit<RequestConfig, 'params' | 'data'>> & { params: Params; data?: Data },
      ) => FetchPromise<Result>
  : (config?: RequestCustomConfig & Partial<RequestConfig>) => FetchPromise;

/**
 * Return type of 'registApi' result
 */
export type RegistApi<C extends Record<string, MethodUrl> = Record<string, MethodUrl>> = {
  [P in keyof C]: RequestDefinition<C[P]>;
};

type ValueOf<T> = T[keyof T];
export type Request = ValueOf<RegistApi>;
