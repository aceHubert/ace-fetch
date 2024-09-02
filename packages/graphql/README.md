## @ace-fetch/graphql

> Graphql fetch provider  
> `Typescript` support

## 安装

```bash
yarn add @ace-fetch/graphql
或者
npm i -S @ace-fetch/graphql
```

<br>

## 使用


```javascript
import { regisApi } from '@ace-fetch/graphql';

interface User{
  id: number;
  firstName: string;
  lastName: string;
  city: string;
}

// 定义 apis
const userApi = registGraphql(axiosInstance, {
  // 定义 api
  getUsers: 'get /users'
  // typedUrl 可以是函数传 RequestConfig 作为当前请求的定义
  addUser: typedUrl<User, any, Partial<Omit<User, 'id'>>>({
    timeout: 10000
  })`post /user`,
}, prefix);

userApi.getUsers().then(({data})=>{ ... });
// params 参数
userApi.getUsers({ params: {id:1} }).then(({data})=>{  ... });
// body 参数
userApi.addUser({ data: { firstName:'San', lastName: 'Zhang', city: 'BeiJing' }}).then(({data})=>{  ... });

```
