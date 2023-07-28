import { defineNuxtRouteMiddleware } from 'nuxt/app';
import { useUserApi } from '../apis/useUserApi';

// error befor app mount.
// const useApi = useUserApi();
// or set fetch instance
// import { fetch } from '../apis';
// const useApi = useUserApi(fetch);

export default defineNuxtRouteMiddleware(async () => {
  // use outside of component,
  // must be after app mount.
  const useApi = useUserApi();
  const users = await useApi.getUsers();
  console.log(users);
});
