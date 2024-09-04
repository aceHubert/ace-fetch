## @ace-fetch/uni-app

> uni-app adapter and typing for `@ace-fetch/core`

## 安装

```bash
yarn add @ace-fetch/uni-app
或者
npm i -S @ace-fetch/uni-app
```

<br>

## 使用

#### 在 `@ace-fetch/core` 使用插件注册

> 1、`regist` 系列方法使用 [Promise chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#chaining) 处理, 先注册先执行；如果中途chaining 被阻止，后续方法将不会执行。    
> 2、通过 `use` 方法注册的插件应用到所有通过 `defineRegistApi` 定义的方法上。  
> 3、通过 `defineRegistApi` 的 `plugins` 注册的插件只应用在当前定义的方法上。  
> 4、通过 `defineRegistApi` 的 `plugins` 注册的插件比通过 `use` 方法注册的插件先执行。  
> <font color="red">注：catchError 与其它方法同时使用时建议把catchError放在最后注册，catchError handler 如果阻止Promise执行会使后面方法不生效。</font>  
> <font color="red">问题：catchError 在 fetch.use 和 defineRegistApi.plugins同时使用时，本地plugins中hanlder阻止Promise继续执行会导致use插件中的代码无法正常执行。</font>

```javascript
import { createApp } from 'vue';
import { createCatchErrorPlugin, createLoadingPlugin, createRetryPlugin } from '@ace-fetch/core'
import { createFetch, defineRegistApi } from '@ace-fetch/vue';
import { UinAppClient } from '@ace-fetch/uni-app';

const client = new UinAppClient({
  withCredentials: true,
});

const apiFetch = createFetch(client);

apiFetch.use(
  createCatchErrorPlugin({
    // 当接口通过body返回异常消息，可通过此方法判断
    // 注意：如果有全局自定义 interceptors，在 request 中不能改变返回的类型，data 参数为 AxiosResponse data 参数
    serializerData(data){
      if(data.success){
        return data.data
      }else{
        return Promise.reject(new Error(data.message))
      }
    },
    handler: (error)=>{
      // 处理异常

      // 阻止接口继续执行
      return new Promise((resolve)=>{})
    }
  })
)

apiFetch.use(
  createLoadingPlugin({
    delay: 260, // 延迟显示，如果接口在设置时间内返回则不调用handler方法
    handler: () => {
      // 显示loading的处理方法
      // 显示 loading
      return () => {
        // 隐藏 loading
      };
    },
  })
)

apiFetch.use(
  createRetryPlugin({
     maxCount: 3, // 重试次数
     delay: true, // 重试延迟
     validateError: (err)=> true // 触发retry的条件
  })
)

// 定义 registApi
const useUserApi = defineRegistApi('user', {
  definition: {
    getUser: 'get /user',
  },
  plugins:[
    createCatchErrorPlugin({
      ...
    }),
    createLoadingPlugin({
      ...
    }),
    createRetryPlugin({
      ...
    })
  ]
});

const useApi = useUserApi();

// 使用registApi
useApi.getUser({
  // 全局 loading 生效
  loading: true,
});

// fetch.client 指向是 UinAppClient
apiFetch.client.get('/user', {
  // 全局 loading 不生效
  loading: true,
});


// 在Vue中使用请查看"@ace-fetch/vue"文档
const app = createApp({});
app.use(apiFetch);
app.mount('#app');
```
