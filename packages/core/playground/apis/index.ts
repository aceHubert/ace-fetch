import axios from 'axios';
import { registApi, typedUrl } from '@ace-fetch/core';

const axiosInstance = axios.create({
  timeout: 10000,
});

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
};

export const userApi = registApi(
  axiosInstance,
  {
    getUsers: typedUrl<User[]>`get /users`,
    getUser: typedUrl<User, { id: string | number }>`/user/${(params:{id:string}) => params.id}`,
    addUser: typedUrl<User, any, Partial<Omit<User, 'id'>>>`post /user`,
    delUser: typedUrl<never, { id: string | number }>`delete /user/${'id'}`,
  },
  'http://localhost:7009',
);
