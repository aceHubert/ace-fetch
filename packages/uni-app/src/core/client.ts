import { dispatchRequest } from './dispatchRequest';
import { InterceptorManager, type Interceptor } from './interceptorManager';
import { mergeConfig } from './mergeConfig';

// Types
import type { FetchClient, RequestConfig, Response } from '@ace-fetch/core';

export class UinAppClient implements FetchClient {
  interceptors = {
    request: new InterceptorManager<RequestConfig>(),
    response: new InterceptorManager<Response>(),
  };

  constructor(private defaults: Partial<RequestConfig>) {}

  request<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R>;
  request<T = any, R = Response<T>>(config: RequestConfig): Promise<R>;
  request<T = any, R = Response<T>>(configOrUrl: string | RequestConfig, config?: Partial<RequestConfig>): Promise<R> {
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    config = mergeConfig(this.defaults, config);

    // Set config.method
    if (config.method) {
      config.method = config.method.toUpperCase() as RequestConfig['method'];
    } else if (this.defaults.method) {
      config.method = this.defaults.method.toUpperCase() as RequestConfig['method'];
    } else {
      config.method = 'GET';
    }

    // filter out skipped interceptors
    const requestInterceptorChain: Array<Interceptor['fulfilled'] | Interceptor['rejected']> = [],
      responseInterceptorChain: Array<Interceptor['fulfilled'] | Interceptor['rejected']> = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor: Interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config as RequestConfig) === false) {
        return;
      }

      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor: Interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;

    if (!synchronousRequestInterceptors) {
      let chain = [dispatchRequest, undefined];

      Array.prototype.unshift.apply(chain, requestInterceptorChain);
      chain = chain.concat(responseInterceptorChain as any);

      promise = Promise.resolve(config);
      while (chain.length) {
        promise = promise.then(chain.shift() as Interceptor['fulfilled'], chain.shift() as Interceptor['rejected']);
      }

      return promise;
    }

    var newConfig = config as RequestConfig;
    while (requestInterceptorChain.length) {
      var onFulfilled = requestInterceptorChain.shift();
      var onRejected = requestInterceptorChain.shift();
      try {
        newConfig = onFulfilled?.(newConfig);
      } catch (error) {
        onRejected?.(error);
        break;
      }
    }

    try {
      promise = dispatchRequest(newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    while (responseInterceptorChain.length) {
      promise = promise.then(
        responseInterceptorChain.shift() as Interceptor['fulfilled'],
        responseInterceptorChain.shift() as Interceptor['rejected'],
      );
    }

    return promise;
  }

  get<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R> {
    return this.request({
      url,
      method: 'GET',
      ...config,
    });
  }
  delete<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R> {
    return this.request({
      url,
      method: 'DELETE',
      ...config,
    });
  }
  head<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R> {
    return this.request({
      url,
      method: 'HEAD',
      ...config,
    });
  }
  options<T = any, R = Response<T>>(url: string, config?: RequestConfig): Promise<R> {
    return this.request({
      url,
      method: 'OPTIONS',
      ...config,
    });
  }
  post<T = any, R = Response<T>>(url: string, data?: any, config?: RequestConfig): Promise<R> {
    return this.request({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }
  put<T = any, R = Response<T>>(url: string, data?: any, config?: RequestConfig): Promise<R> {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }
  patch<T = any, R = Response<T>>(url: string, data?: any, config?: RequestConfig): Promise<R> {
    throw new Error('Method not implemented.');
  }
}
