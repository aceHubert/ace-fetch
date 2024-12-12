import { RequestConfig, Response } from '@ace-fetch/core';
import { forEach } from '../utils';

/**
 * Transform the data for a request or a response
 */
export function transformData(
  this: RequestConfig,
  fns?: ((data: any, status?: number) => any) | Array<(data: any, status?: number) => any>,
  response?: Response,
) {
  const config = this;
  const context = response || config;
  let data = context.data;

  forEach(fns || [], function transform(fn: (data: any, status?: number) => any) {
    data = fn.call(config, data, response?.status);
  });

  return data;
}
