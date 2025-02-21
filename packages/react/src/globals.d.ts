import type { FetchClient, RegistApi, MethodUrl } from '@ace-fetch/core';

declare module '@ace-fetch/core' {
  export const debug: Readonly<boolean>;

  export function registApi<C extends Record<string, MethodUrl>>(
    client: FetchClient,
    apis: C,
    prefix?: string,
    id?: string | Symbol,
  ): RegistApi<C>;
}

export {};
