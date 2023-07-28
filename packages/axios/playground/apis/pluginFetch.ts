import axios from 'axios';
import { ref } from 'vue-demi';
import { createFetch } from '@ace-fetch/vue';
import { createCatchErrorPlugin, createLoadingPlugin, createRetryPlugin } from '@ace-fetch/axios';

const axiosInstance = axios.create({
  timeout: 10000,
});

const pluginFetch = createFetch(axiosInstance);

export const loadingRef = ref(false);

pluginFetch.use(
  createLoadingPlugin({
    handler: () => {
      loadingRef.value = true;
      return () => {
        loadingRef.value = false;
      };
    },
  }),
);

pluginFetch.use(
  createRetryPlugin({
    maxCount: 5,
  }),
);

// catchError 放在最后注册，handler 中阻止了Promise继续执行
pluginFetch.use(
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
    handler: (error: Error) => {
      if (
        axios.isAxiosError(error) &&
        Object.prototype.toString.call(error.response?.data) === '[object Object]' &&
        (error.response?.data as any).code === '400'
      ) {
        // http code error, and message from data
        alert(`global error handler from local plugin, ${(error.response?.data as any).message || ''}`);
      } else {
        alert(`global error handler from plugin: ${error.message}`);
      }
      return new Promise(() => {});
    },
  }),
);

export { pluginFetch };
