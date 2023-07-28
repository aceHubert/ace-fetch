import { typedUrl } from '@ace-fetch/core';
import { defineRegistApi } from '@ace-fetch/vue';

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
};

export const useUserApi = defineRegistApi('user', {
  apis: {
    getUsers: typedUrl<User[]>`/Users`,
    getUser: typedUrl<User[], { id: string | number }>`/User/${'id'}`,
    timeout: typedUrl<string>`/timeout`,
    error400: typedUrl<string>`/error`,
    bodyError: typedUrl<string>`/body-error`,
  },
  prefix: 'http://localhost:7009',
});
