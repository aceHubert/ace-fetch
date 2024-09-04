## @ace-fetch/graphql

> Graphql fetch provider  

## 安装

```bash
yarn add @ace-fetch/graphql
或者
npm i -S @ace-fetch/graphql
```

<br>

## 使用


```javascript
import { regisApi, TypedQueryDocumentNode } from '@ace-fetch/graphql';
import { ApolloClient } from '@apollo/client';
import { gql } from 'graphql-tag';

interface User{
  id: number;
  firstName: string;
  lastName: string;
  city: string;
}

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache()
});

// 定义 apis
const userApi = registGraphql(client, {
  // 定义 api
  getUsers: gql`
    query getUsers($page: Int, $size: Int){
      users(page: $page, size: $size){
        id
        firstName
        lastName
        city
      }
    }
  ` as TypedQueryDocumentNode<{users: User[]},{page?: number, size?: number}>,
  getUser: gql`
    query getUser($id: Int){
      user(id: $id){
        id
        firstName
        lastName
        city
      }
    }
  ` as TypedQueryDocumentNode<{user: User}, {id?: number}>,
  // typedUrl 可以是函数传 RequestConfig 作为当前请求的定义
  addUser: gql`
    mutation addUser($firstName: String!, $lastName: String!, $city: String!){
      addUser(firstName: $firstName, lastName: $lastName, city: $city){
        id
        firstName
        lastName
        city
      }
    }
  ` as TypedQueryDocumentNode<User, {firstName: string, lastName: string, city: string}>
});

// 调用
userApi.getUsers().then(({users})=>{ ... });
// query
userApi.getUsers({ variables: {id:1} }).then(({user})=>{  ... });
// mutation
userApi.addUser({ variables: { firstName:'San', lastName: 'Zhang', city: 'BeiJing' }}).then(({user})=>{  ... });

```
