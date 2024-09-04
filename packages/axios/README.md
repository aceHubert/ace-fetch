## @ace-fetch/axios

> axios plugins on interceptors

## 安装

```bash
yarn add @ace-fetch/axios
或者
npm i -S @ace-fetch/axios
```

<br>

## 使用方法

> `apply` 系列方法使用 [`axios interceptors`](https://axios-http.com/docs/interceptors) 处理，如果有自定义 `interceptors` 不能改变返回类型，处理方法对`AxiosResponse`、`AxiosError`结构存在依赖。  
> <font color="red">问题：CanceledError 错误少了 config 参数，无法确认用户传入的处理条件。</font>

```javascript
import axios from 'axios'
import { applyLoading, applyRetry, applyCatchError } from '@ace-fetch/axios'

const axiosInstance = axios.create({})

// loading
applyLoading(axiosInstance,{
  delay: 260, // 延迟显示，如果接口在设置时间内返回则不调用handler方法
  handler: ()=>{ // 显示loading的处理方法
    // 显示 loading
    return ()=>{
      // 隐藏 loading
    }
  }
})

axiosInstance.request({
  loading: true // 是否显示loading, 或自定义设置当前loading handler方法
})

// retry
applyRetry(axiosInstance, {
   maxCount: 3, // 重试次数
   delay: true, // 重试延迟
   validateError: (err)=> true // 触发retry的条件
})

axiosInstance.request({
  retry: true // 是否使用 retry, 或自定义设置重写 registRetry 参数
}）

// catchError
applyCatchError(axiosInstance,{
    // 当接口通过body返回异常消息，可通过此方法判断
    serializerData(data){
      if(data.success){
        return data.data
      }else{
        return Promise.reject(new Error(data.message))
      }
    },
  handler: (err)=> new Promise(()=>{}) // 全局catch error 方法，默认会阻止往后执行
})

axiosInstance.request({
  catchError: true // 是否启用catch error
}）

```

