## @ace-fetch/vue

> vue adapter and typing for `@ace-fetch/core`
> 在 `Vue 3.x` or `Vue 2.16.x + @vue/composition-api` 中使用，  
> 同时支持在Vue实例外调用，以及手动控制当前激活的fetch对象

## 安装

```bash
yarn add @ace-fetch/vue
或者
npm i -S @ace-fetch/vue
```

<br>

## 使用方法

### Define Regist Api

```javascript
import { createCatchErrorPlugin } from '@ace-fetch/core';
import { createFetch, defineRegistApi } from '@ace-fetch/vue';

const apiFetch = createFetch(axiosInstance)


// 注册全局插件
apiFetch.use(createCatchErrorPlugin({
  handler: (error) => {
    // 处理异常
    return new Promise((resolve) => {});
  },
}))

// 定义 regsitApi
const useUserApi = defineRegistApi('user',{
  definition:{
    getUsers: typedUrl<User[]>`get /users`
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
})

```

###  Vue2
```javascript

import Vue from 'vue'
import { getActiveFetch, FetchVuePlugin } from '@ace-fetch/vue';

// Vue2 中必须注册插件
Vue.use(FetchVuePlugin);

// 注册 apiFetch 到 Vue
new Vue({
  ...
  apiFetch,
}).$mount('#app')

// 组件内使用
{
  created(){
    const userApi = useUserApi();
    userApi.getUsers()
  }
}
// 在 @vue/composition-api 中使用 registApi
import { defineComponent } from '@vue/composition-api'

defineComponent({
  setup(){
    const userApi = useUserApi();
    userApi.getUsers()
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
// 注册 apiFetch
app.use(apiFetch)

// 组件内使用
defineComponent({
  setup(){
    const userApi = useUserApi();
    userApi.getUsers()
  }
})
```
