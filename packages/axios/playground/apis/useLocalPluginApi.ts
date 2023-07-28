import axios from 'axios';
import { typedUrl } from '@ace-fetch/core';
import { defineRegistApi } from '@ace-fetch/vue';
import { createCatchErrorPlugin } from '@ace-fetch/axios';

export const useLocalPluginApi = defineRegistApi('plugin', {
  apis: {
    timeout: typedUrl<string>`/timeout`,
    error400: typedUrl<string>`/error`,
    bodyError: typedUrl<string>`/body-error`,
  },
  prefix: 'http://localhost:7009',
  plugins: [
    // catchError 放在最后注册，handler 中阻止了Promise继续执行
    createCatchErrorPlugin({
      serializerData: (data: any) => {
        if (data.success !== void 0) {
          if (data.success) {
            return data.data;
          } else {
            return Promise.reject(new Error(data.message));
          }
        }
        return data;
      },
      handler(error: Error) {
        if (
          axios.isAxiosError(error) &&
          Object.prototype.toString.call(error.response?.data) === '[object Object]' &&
          (error.response?.data as any).code === '400'
        ) {
          // http code error, and message from data
          alert(`local error handler from local plugin, ${(error.response?.data as any).message || ''}`);
        } else {
          alert(`local error handler from local plugin, ${error?.message || ''}`);
        }
        return new Promise(() => {}); // 这里阻止继续执行会造成使用 use 注册的插件无法正常执行
      },
    }),
  ],
});
