import axios from 'axios';
import { ref } from 'vue-demi';
import { createFetch } from '@ace-fetch/vue';
import { applyLoading, applyCatchError, applyRetry } from '@ace-fetch/axios';

const axiosInstance = axios.create({
  timeout: 10000,
});

export const loadingRef = ref(false);
applyLoading(axiosInstance, {
  handler: () => {
    loadingRef.value = true;
    return () => {
      loadingRef.value = false;
    };
  },
});

applyCatchError(axiosInstance, {
  handler: (error: Error) => {
    alert(`global error handler: ${error.message}`);
    return new Promise(() => {});
  },
});

applyRetry(axiosInstance, {
  maxCount: 5,
});

export const fetch = createFetch(axiosInstance);
