import axios, { AxiosRequestConfig } from 'axios';
import { ref } from 'vue-demi';
import { createFetch } from '@ace-fetch/vue';

const axiosInstance = axios.create({
  timeout: 10000,
});

axiosInstance.interceptors.request.use((config) => {
  const apiKey = useRuntimeConfig().public.apiKey;
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

export const fetch = createFetch(axiosInstance);

declare module '@ace-fetch/core' {
  export interface RequestConfig extends AxiosRequestConfig {}
}
