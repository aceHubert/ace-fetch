export interface UniFetchRequestTransformer {
  (data: any): any;
}

export interface UniFetchResponseTransformer {
  (data: any, status?: number): any;
}

declare module '@ace-fetch/core' {
  interface RequestConfig {
    transformRequest?: UniFetchRequestTransformer | UniFetchRequestTransformer[];
    transformResponse?: UniFetchResponseTransformer | UniFetchResponseTransformer[];
  }
}
