import { trailingSlash, isAbsoluteUrl } from '@ace-util/core';
import queryString, { type StringifyOptions } from 'query-string';

// Types
import type {
  FetchClient,
  Prefix,
  Method,
  MethodUrl,
  MethodUrlWithConfig,
  MethodUrlFn,
  RequestDefinition,
  RegistApi,
  RequestConfig,
  RequestType,
  FetchPromise,
} from '../types';

const REQUEST_HEADERS: Record<RequestType, Record<string, any>> = {
  form: { 'Content-Type': 'application/x-www-form-urlencoded' },
  json: { 'Content-Type': 'application/json;charset=utf-8' },
};

/**
 * serializer request data
 * @param data request data
 * @param requestType request type
 * @param options stringify options for form request
 */
function defaultDataSerializer(data: any, requestType: RequestType, options?: StringifyOptions): any {
  switch (requestType) {
    case 'form':
      return typeof data === 'string' ? data : queryString.stringify(data, options);
    default:
      return data;
  }
}

/**
 * form data serializer
 * @param data request data
 * @param options stringify options
 */
export function formDataSerializer(data: any, options?: StringifyOptions): string {
  return defaultDataSerializer(data, 'form', options);
}

/**
 * format request path
 * checking on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
 * @param params request params
 * @param strings template literals string array
 * @param keys template literals key array
 * @returns formatted string
 */
function formatRequestPath(
  params: Record<string, any>,
  strings: TemplateStringsArray,
  keys: Array<string | Function>,
): string {
  var result = [strings[0]];
  // TODO: used params properties should remove form params
  keys.forEach(function (key, i) {
    var value = typeof key === 'function' ? key(params) : params[key];
    result.push(value, strings[i + 1]);
  });
  return result.join('');
}

/**
 * typed url with no local config
 * @param strings TemplateStringsArray
 * @param keys string key or function, function first argument is request params
 * @returns the method url format function
 */
export function typedUrl<R = any, P extends Record<string, any> = any, D = any>(
  strings: TemplateStringsArray,
  ...keys: Array<string | Function>
): MethodUrlFn<R, P, D>;
/**
 * typed url with local config
 * @param config local config object
 * @returns template literals function
 */
export function typedUrl<R = any, P extends Record<string, any> = any, D = any>(
  config: Partial<RequestConfig<D>>,
): (strings: TemplateStringsArray, ...keys: Array<string | Function>) => MethodUrlFn<R, P, D>;
export function typedUrl<R, P extends Record<string, any>, D>(
  configOrStrings: Partial<RequestConfig> | TemplateStringsArray,
  ...keys: Array<string | Function>
): MethodUrlFn<R, P, D> | ((strings: TemplateStringsArray, ...keys: Array<string | Function>) => MethodUrlFn<R, P, D>) {
  // withConfig
  if (!Array.isArray(configOrStrings)) {
    return function (strings: TemplateStringsArray, ...innerKeys: Array<string | Function>) {
      return function (params: P): MethodUrlWithConfig {
        return [configOrStrings as Partial<RequestConfig>, formatRequestPath(params, strings, innerKeys)];
      };
    };
  } else {
    return function (params: P): string {
      return formatRequestPath(params, configOrStrings as TemplateStringsArray, keys);
    };
  }
}

/**
 * register api
 * @param client fetch client
 * @param definition  typed request definition
 * @param prefix base url
 * @returns named fetch requests
 */
export function registApi<C extends Record<string, MethodUrl>>(
  client: FetchClient,
  definition: C,
  prefix?: Prefix,
): RegistApi<C>;
/**
 * register api for plugin use
 * @internal
 * @param client fetch client
 * @param definition  typed request definition
 * @param prefix base url
 * @param id regist id
 * @returns named fetch requests
 */
export function registApi<C extends Record<string, MethodUrl>>(
  client: FetchClient,
  definition: C,
  prefix?: Prefix,
  id?: string | Symbol,
): RegistApi<C>;
export function registApi<C extends Record<string, MethodUrl>>(
  client: FetchClient,
  definition: C,
  prefix?: Prefix,
  id?: string | Symbol,
): RegistApi<C> {
  const result = {} as RegistApi<C>;
  Object.keys(definition).forEach((methodName) => {
    const methodUrl = definition[methodName];
    result[methodName as keyof C] = transfromToRequest(client.request.bind(client), methodUrl, prefix, id) as any;
  });
  return result;
}

function quoteProxy(obj: Record<string, any>, keys: string[] = []) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  Object.keys(obj).forEach((key) => {
    definedQuote(obj, key, obj[key]);
  });

  function definedQuote(obj: object, key: string, value: any) {
    Object.defineProperty(obj, key, {
      get: () => {
        !keys.includes(key) && keys.push(key);
        return value;
      },
      set: (val) => {
        if (val !== value) {
          value = val;
        }
      },
    });
  }
}

/**
 * method url transfor to request definition
 * @param request fetch request
 * @param methodUrl method url
 * @param prefix base url
 * @param id regist id
 * @returns request definition
 */
function transfromToRequest(
  request: (config: RequestConfig) => FetchPromise,
  methodUrl: MethodUrl,
  prefix?: Prefix,
  id?: string | Symbol,
): RequestDefinition<MethodUrl> {
  return (config: Partial<RequestConfig> = {}) => {
    let { requestType, dataSerializer, ...requestConfig } = config;

    // method url 置换
    let methodConfig = methodUrl as string | [Partial<RequestConfig>, string];
    if (typeof methodUrl === 'function') {
      const quotaKeys: string[] = [];
      quoteProxy(config.params, quotaKeys);
      methodConfig = methodUrl(config.params);
      // 移出格式华url参数时被使用的 key
      quotaKeys.forEach((key) => {
        delete config.params[key];
      });
    }

    if (Array.isArray(methodConfig)) {
      const [{ requestType: presetRequestType, dataSerializer: presetDataSerializer, ...presetConfig }, methodPath] =
        methodConfig;
      // 最终的 config 优先，通过 typedUrl 预定义的 config 其次
      requestConfig = { ...presetConfig, ...requestConfig };
      requestType = requestType ?? presetRequestType;
      dataSerializer = dataSerializer ?? presetDataSerializer;
      methodConfig = methodPath;
    }

    if (methodConfig) {
      // Fixed url
      // example:
      //  'getUser' => 'get getUser'
      //  'post updateUser'
      const methodConfigArr = methodConfig.split(' ');
      const [method, urlPath] = methodConfigArr.length === 1 ? ['get', methodConfig] : methodConfigArr;
      // 拼接 prefix (处理prefix 末尾以及 urlPath 开始 / 的重复)
      const prefixStr = typeof prefix === 'function' ? prefix(urlPath) : prefix || '';
      const url = isAbsoluteUrl(urlPath)
        ? urlPath
        : trailingSlash(prefixStr) + (urlPath.startsWith('/') ? urlPath.substring(1) : urlPath);
      requestConfig.url = url;
      requestConfig.method = method as Method;
    } else if (config.url) {
      // Dynamic url
      const urlPath = config.url;
      // 拼接 prefix (处理prefix 末尾以及 urlPath 开始 / 的重复)
      const prefixStr = typeof prefix === 'function' ? prefix(urlPath) : prefix || '';
      const url = isAbsoluteUrl(urlPath)
        ? urlPath
        : trailingSlash(prefixStr) + (urlPath.startsWith('/') ? urlPath.substring(1) : urlPath);
      requestConfig.url = url;
    }

    if (!requestType) requestType = 'json';
    if (!dataSerializer) dataSerializer = defaultDataSerializer;

    // headers 默认值设置
    requestConfig.headers = {
      ...(REQUEST_HEADERS[requestType] || {}),
      ...(requestConfig.headers || {}),
    };

    // serializer data
    requestConfig.data = dataSerializer(requestConfig.data, requestType);

    // 标记为通过 registApi 注册
    requestConfig._registId = id;

    return request(requestConfig);
  };
}

/**
 * @internal
 */
declare module '../types' {
  export interface RequestConfig {
    /**
     * From 'registApi' unique id
     */
    _registId?: string | Symbol;
  }
}
