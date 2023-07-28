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


###  Vue2
```javascript

import Vue from 'vue'
import { createFetch, defineRegistApi, setActiveFetch, FetchVuePlugin } from '@vue-async/fetch';

// Vue2 中必须引用插件
Vue.use(FetchVuePlugin);

const afetch = createFetch(axiosInstance)

// 注册 registApi 插件
afetch.use(plugin)

// 定义 regsitApi
const useUserApi = defineRegistApi('user',{
  apis:{
    getUsers: typedUrl<User[]>`get /users`
  }
})

// 注册 afetch 到 Vue
new Vue({
  ...
  afetch,
}).$mount('#app')

// 组件内使用
{
  created(){
    this.$afetch.client // axiosInstance from createFetch
    setActiveFetch(afetch) // 手动设置当前 active fetch 对象
    
    // 使用当前 active fetch 对象
    const userApi = useUserApi();

    // 或使用其它的 fetch 对象注册regist api
    const userApi = useUserApi(afetch);

    // 调用方法
    userApi.getUsers()
  }
}
// 或者
{
  inject:{
    'afetch':{from: fetchSymbol}
  },
  created(){
    this.afetch
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
```

### Vue3
```javascript
import { createApp, defineComponent } from 'vue'
import { createFetch, defineRegistApi } from '@vue-async/fetch';

const afetch = createFetch(axiosInstance)

const app = createApp({
  ...
})
// 注册 afetch
app.use(afetch)

// 注册 registApi 插件
afetch.use(plugin)

// 定义 regsitApi
const useUserApi = defineRegistApi('user',{
  apis:{
    getUsers: typedUrl<User[]>`get /users`
  },
  prefix: '/'
})

// 组件内使用
defineComponent({
  setup(){
    const userApi = useUserApi();
    userApi.getUsers()
  }
})
```
