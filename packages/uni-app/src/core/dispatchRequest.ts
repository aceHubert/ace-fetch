import URLSearchParams from '@ungap/url-search-params';
import { UniFetchError } from './UniFetchError';
import { transformData } from './transformData';

// Types
import type { RequestConfig, Response } from '@ace-fetch/core';

declare let wx: UniApp.Uni;

const app = uni || wx;

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

    transformData.call(config, config.transformRequest);

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
        response.data = transformData.call(config, config.transformResponse, response);

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
