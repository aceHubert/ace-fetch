import { UniFetchError } from './UniFetchError';
import { buildURL } from './buildUrl';
import { transformData } from './transformData';

// Types
import type { RequestConfig, Response } from '@ace-fetch/core';

declare let wx: UniApp.Uni;

const app = uni || wx;

// @ts-ignore
export function dispatchRequest({ url, method, headers, params, ...rest }: RequestConfig): Promise<Response<any>> {
  return new Promise((resolove, reject) => {
    const config = {
      url: buildURL(url, params, rest.paramsSerializer),
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
