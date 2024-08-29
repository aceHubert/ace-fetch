import URLSearchParams from '@ungap/url-search-params';

// Types
import type { RequestConfig, Response } from '@ace-fetch/core';

declare let wx: UniApp.Uni;

const app = uni || wx;

export class UniFetchError extends Error {
  config: RequestConfig;
  response?: Response<any>;

  constructor(message: string, config: RequestConfig, response?: Response<any>) {
    super(message);
    this.config = config;
    this.response = response;
  }
}

export const isUniFetchError = (error: any): error is UniFetchError => error instanceof UniFetchError;

// @ts-ignore
export function dispatchRequest({ url, method, params, headers, ...rest }: RequestConfig): Promise<Response<any>> {
  return new Promise((resolove, reject) => {
    if (params && Object.keys(params).length > 0) {
      url += (url!.indexOf('?') >= 0 ? '&' : '?') + new URLSearchParams(params).toString();
    }
    const config = {
      url: url!,
      method: method as UniApp.RequestOptions['method'],
      header: headers,
      ...rest,
    };

    app.request({
      ...config,
      success: ({ statusCode, errMsg, ...resp }) => {
        const response = {
          data: resp.data,
          status: statusCode,
          statusText: errMsg || `Http error: ${statusCode}`,
          headers: resp.header,
          config,
        };
        if (statusCode >= 400) {
          reject(new UniFetchError(errMsg || `Http error: ${statusCode}`, config, response));
        } else {
          resolove(response);
        }
      },
      fail: (error) => {
        reject(new UniFetchError(error.errMsg, config));
      },
    });
  });
}
