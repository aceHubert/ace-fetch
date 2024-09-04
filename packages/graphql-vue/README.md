## @ace-fetch/grapqhl-vue

> vue adapter and typing for `@ace-fetch/graphql`
> 在 `Vue 3.x` or `Vue 2.16.x + @vue/composition-api` 中使用，  
> 同时支持在 Vue 实例外调用，以及手动控制当前激活的 fetch 对象

## 安装

```bash
yarn add @ace-fetch/graphql-vue
或者
npm i -S @ace-fetch/graphql-vue
```

<br>

## 使用方法

### Define Regist GraphQL

```javascript
import { ApolloClient } from '@apollo/client';
import { createCatchErrorPlugin } from '@ace-fetch/graphql';
import { createFetch, defineRegistGrapqhl, getActiveFetch, FetchVuePlugin, gql } from '@ace-fetch/graphql-vue';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache(),
});
const graphqlFetch = createFetch(client);

// 注册全局插件
graphqlFetch.use(
  createCatchErrorPlugin({
    handler: (error) => {
      // 处理异常
      return new Promise((resolve) => {});
    },
  }),
);

interface User {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
}

// 定义 regsitGrapqhl
const useUserApi = defineRegistGrapqhl('user', {
  definition: {
    getUsers: gql`
      query getUsers($page: Int, $size: Int) {
        users(page: $page, size: $size) {
          id
          firstName
          lastName
          city
        }
      }
    `,
  },
  // 注册本地插件（插件注意执行先后顺序，本地插件优先于全局插件执行）
  plugins:[
    createCatchErrorPlugin({
      handler: (error) => {
        // 处理异常
        return new Promise((resolve) => {});
      },
    })
  ]
});
```

### Vue2

```javascript
import Vue from 'vue'
import { getActiveFetch, FetchVuePlugin } from '@ace-fetch/graphql-vue';

// Vue2 中必须注册插件
Vue.use(FetchVuePlugin);

// 注册 graphqlFetch 到 Vue
new Vue({
  ...
  graphqlFetch,
}).$mount('#app')

// 组件内使用
{
  created(){
    const userApi = useUserApi();
    userApi.getUsers().then(({users})=>{ ... });
  }
}
// 在 @vue/composition-api 中使用
import { defineComponent } from '@vue/composition-api'

defineComponent({
  setup(){
    const userApi = useUserApi();
    userApi.getUsers().then(({users})=>{ ... });
  }
})


// 组件外调用
import fetch from '...'
const userApi = useUserApi(fetch); // 指定fetch对象
const userApi = useUserApi(getActiveFetch()); // 获取当前激活的fetch对象

```

### Vue3

```javascript
import { createApp, defineComponent } from 'vue'

const app = createApp({
  ...
})
// 注册 graphqlFetch
app.use(graphqlFetch)


// 组件内使用
defineComponent({
  setup(){
    const userApi = useUserApi();
    userApi.getUsers()
  }
})
```

### Multiple Client

```javascript
// client 定义成工厂函数
const graphqlFetch = createFetch((options) => {
  return new ApolloClient({
    links: [new HttpLink({ uri: options.uri })],
    cache: new InMemoryCache(),
    ...options,
  });
});

// 定义 regsitGrapqhl
const useUserApi = defineRegistGrapqhl('user', {
  definition: {
    getUsers: gql`
      query getUsers($page: Int, $size: Int) {
        users(page: $page, size: $size) {
          id
          firstName
          lastName
          city
        }
      }
    `,
  },
  // 当定义了 clientOptions 时，将会创建一个新的 client 用于当前 registGraphql
  clientOptions: {
    link: new HttpLink({ uri: 'http://localhost:3000/graphql' }),
  },
});
```
