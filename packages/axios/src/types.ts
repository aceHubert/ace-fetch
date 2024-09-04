import type { RequestCustomConfig } from '@ace-fetch/core';

declare module 'axios' {
  interface AxiosRequestConfig extends RequestCustomConfig {}
}
