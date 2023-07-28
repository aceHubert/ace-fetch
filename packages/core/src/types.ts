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
  /**
   * From 'registApi' unique id
   * @internal
   */
  _registId?: string;
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
  (config: RequestConfig): FetchPromise;
  (url: string, config?: RequestConfig): FetchPromise;

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
 * method url transfor to request definition
 */
export type RequestDefinition<MethodUrl> = MethodUrl extends MethodUrlFn<infer Result, infer Params, infer Data>
  ? CheckAny<Params> extends 'yes'
    ? (
        config?: Partial<Omit<RequestConfig, 'params' | 'data'> & { params?: Params; data?: Data }>,
      ) => FetchPromise<Result>
    : (
        config: Partial<Omit<RequestConfig, 'params' | 'data'>> & { params: Params; data?: Data },
      ) => FetchPromise<Result>
  : (config?: Partial<RequestConfig>) => FetchPromise;

/**
 * Return type of 'registApi' result
 */
export type RegistApi<C extends Record<string, MethodUrl>> = {
  [P in keyof C]: RequestDefinition<C[P]>;
};
