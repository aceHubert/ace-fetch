import axios from 'axios';
import { createFetch } from '@ace-fetch/vue';

const axiosInstance = axios.create({
  timeout: 10000,
});

export const fetch = createFetch(axiosInstance);
