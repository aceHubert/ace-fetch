// Types
import type { RequestConfig, Response } from '@ace-fetch/core';

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
