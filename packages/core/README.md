## @ace-fetch/core

> Core fetch provider  

## 安装

```bash
yarn add @ace-fetch/core
或者
npm i -S @ace-fetch/core
```

<br>

## 使用


```javascript
// 使用 axios 作为示例
import axios from 'axios';
import { regisApi, createCatchErrorPlugin } from '@ace-fetch/core';

// 创建 asiox 实例
const axiosInstance = axios.create({
  timeout: 5000
})

const prefix = 'http://api/base_url/'

interface User{
  id: number;
  firstName: string;
  lastName: string;
  city: string;
}

// 定义 apis
let userApi = registApi(axiosInstance, {
  // 定义 api
  getUsers: 'get /users'
  // 或使用 typedUrl 函数在 typescript 中明确类型定义
  getUsers: typedUrl<User[]>`get /users`,
  // get 可以省略
  // 通过字符串获取 params 中的变量拼接 url
  getUser: typedUrl<User, { id: string | number }>`/user/${'id'}`,
  // 或者通过函数拼接url
  getUser: typedUrl<User, { id: string | number }>`/user/${(params)=> params.id}`,
  // typedUrl 可以是函数传 RequestConfig 作为当前请求的定义
  addUser: typedUrl<User, any, Partial<Omit<User, 'id'>>>({
    timeout: 10000
  })`post /user`,
}, prefix);

// 应用插件
userApi = createCatchErrorPlugin({
  handler: (error) => {
    // 处理异常
    return new Promise((resolve) => {});
  },
})({
  registApis: userApi
})

// 调用方法
userApi.getUsers().then(({data})=>{ ... });
// params 参数
userApi.getUsers({ params: {id:1} }).then(({data})=>{  ... });
// body 参数
userApi.addUser({ data: { firstName:'San', lastName: 'Zhang', city: 'BeiJing' }}).then(({data})=>{  ... });

```
