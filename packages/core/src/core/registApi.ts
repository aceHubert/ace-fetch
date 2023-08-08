import {
  FetchClient,
  Method,
  MethodUrl,
  MethodUrlWithConfig,
  MethodUrlFn,
  RequestDefinition,
  RegistApi,
  RequestConfig,
  FetchPromise,
} from '../types';

const REQUEST_HEADERS = {
  form: { 'Content-Type': 'application/x-www-form-urlencoded' },
  json: { 'Content-Type': 'application/json;charset=utf-8' },
};

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
export function typedUrl<R = any, P = any, D = any>(
  strings: TemplateStringsArray,
  ...keys: Array<string | Function>
): MethodUrlFn<R, P, D>;
/**
 * typed url with local config
 * @param config local config object
 * @returns template literals function
 */
export function typedUrl<R = any, P = any, D = any>(
  config: Partial<RequestConfig>,
): (strings: TemplateStringsArray, ...keys: Array<string | Function>) => MethodUrlFn<R, P, D>;
export function typedUrl<R, P, D>(
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
 * @param apis  typed urls
 * @param prefix base url
 * @returns named fetch requests
 */
export function registApi<C extends Record<string, MethodUrl>>(
  client: FetchClient,
  apis: C,
  prefix?: string,
): RegistApi<C>;
/**
 * register api for plugin use
 * @param client fetch client
 * @param apis  typed urls
 * @param prefix base url
 * @param id regist id
 * @returns named fetch requests
 */
export function registApi<C extends Record<string, MethodUrl>>(
  client: FetchClient,
  apis: C,
  prefix?: string,
  id?: string,
): RegistApi<C>;
export function registApi<C extends Record<string, MethodUrl>>(
  client: FetchClient,
  apis: C,
  prefix?: string,
  id?: string,
): RegistApi<C> {
  const result = {} as RegistApi<C>;
  Object.keys(apis).forEach((methodName) => {
    const methodUrl = apis[methodName];
    result[methodName as keyof C] = transfromToRequest(client, methodUrl, prefix, id) as any;
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
  request: (url: string, config?: RequestConfig) => FetchPromise,
  methodUrl: MethodUrl,
  prefix = '',
  id?: string,
): RequestDefinition<MethodUrl> {
  return (config: Partial<RequestConfig> = {}) => {
    let { requestType, ...requestConfig } = config;

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
      const [{ requestType: presetRequestType, ...presetConfig }, methodPath] = methodConfig;
      // 最终的 config 优先，通过 typedUrl 预定义的 config 其次
      requestConfig = { ...presetConfig, ...requestConfig };
      requestType = requestType ?? presetRequestType;
      methodConfig = methodPath;
    }

    // 置换 方法 和 地址
    // example:
    //  'getUser' => 'get getUser'
    //  'post updateUser'
    const methodConfigArr = methodConfig.split(' ');
    const [method, urlPath] = methodConfigArr.length === 1 ? ['get', methodConfig] : methodConfigArr;
    // 拼接 prefix (处理prefix 末尾以及 urlPath 开始 / 的重复)
    const url =
      (prefix.endsWith('/') ? prefix : `${prefix}/`) + (urlPath.startsWith('/') ? urlPath.substring(1) : urlPath);
    requestConfig.method = method as Method;
    // headers 默认值设置
    requestConfig.headers = {
      ...(REQUEST_HEADERS[requestType || 'json'] || {}),
      ...(requestConfig.headers || {}),
    };

    // 标记为通过 registApi 注册
    requestConfig._registId = id;

    return request(url, requestConfig);
  };
}
