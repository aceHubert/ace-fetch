import { defineComponent, ref } from 'vue-demi';
import axios, { CancelTokenSource } from 'axios';
import { fetch, loadingRef as globalLoadingRef } from '../apis';
import { loadingRef as pluginGlobalLoadingRef } from '../apis/pluginFetch';
import { pluginFetch } from '../apis/pluginFetch';
import { useUserApi } from '../apis/useUserApi';
import { useLocalPluginApi } from '../apis/useLocalPluginApi';

export default defineComponent({
  name: 'Playground',
  setup() {
    const userApi = useUserApi();
    const localPluginApi = useLocalPluginApi();
    const userPluginApi = useUserApi(pluginFetch);
    const timeoutRef = ref(0);

    // 发送请求10秒内可取消(使用axiose.CancelToken)
    let cancelToken: CancelTokenSource;
    const cancelTimeoutRef = ref(0);
    const sendCanceledRequest = () => {
      cancelTimeoutRef.value = 10;
      cancelToken = axios.CancelToken.source();
      const timer = window.setInterval(() => {
        cancelTimeoutRef.value > 0 && (cancelTimeoutRef.value -= 1);
      }, 1000);
      userApi
        .timeout({
          cancelToken: cancelToken.token,
        })
        .then(({ data }) => {
          alert(data);
        })
        .catch((err: Error) => {
          alert(err.message);
        })
        .finally(() => {
          clearInterval(timer);
        });
    };

    // 取消请求
    const cancelRequest = () => {
      cancelToken && cancelToken.cancel('Operation canceled by the user(axios.CancelToken).');
      cancelTimeoutRef.value = 0;
    };

    // 发送请求10秒内可取消(使用AbortController)
    let abortController: AbortController;
    const abortTimeoutRef = ref(0);
    const sendAbortedRequest = () => {
      abortTimeoutRef.value = 10;
      abortController = new AbortController();
      const timer = window.setInterval(() => {
        abortTimeoutRef.value > 0 && (abortTimeoutRef.value -= 1);
      }, 1000);
      userApi
        .timeout({
          signal: abortController.signal,
        })
        .then(({ data }) => {
          alert(data);
        })
        .catch((err: Error) => {
          alert(err.message);
        })
        .finally(() => {
          clearInterval(timer);
        });
    };

    const abortRequest = () => {
      abortController && abortController.abort('Operation canceled by the user(AbortController).');
      abortTimeoutRef.value = 0;
    };

    // 本地config设置超时（原axios逻辑）
    const sendTimeoutRequest = (timeout = 3000) => {
      timeoutRef.value = timeout / 1000;
      const timer = window.setInterval(() => {
        timeoutRef.value > 0 && (timeoutRef.value -= 1);
      }, 1000);
      userApi
        .timeout({
          timeout,
        })
        .catch((err: Error) => {
          alert(err.message);
        })
        .finally(() => {
          clearInterval(timer);
        });
    };

    // 全局注册catchError, 本地config设置 可以控制 global catch error 方法
    const sendErrorRequest = (catchError = true) => {
      userApi
        .error400({
          catchError,
        })
        .catch((err: Error) => {
          alert(`local error handler: ${err.message}`);
        });
    };

    // 全局注册catchError, 非regist apis 也可以被global catch error 捕获
    const sendErrorRequestWithClient = () => {
      // should catch error
      fetch.client
        .get('http://localhost:7009/error', {
          catchError: true,
        })
        .catch((err) => {
          alert(`local error handler: ${err.message}`);
        });
    };

    // 插件注册到了regist apis上，catchError 可以控制 global catch error 方法
    const sendPluginFetchErrorRequest = (catchError = true) => {
      // should catch error
      userPluginApi
        .error400({
          catchError,
        })
        .catch((err) => {
          alert(`local error handler: ${err.message}`);
        });
    };

    // 插件只注册到了regist apis上，非regist apis 无法被global catch error 捕获
    const sendPluginFetchErrorRequestWithClient = () => {
      // can not catch error in global
      pluginFetch.client
        .get('http://localhost:7009/error', {
          catchError: true,
        })
        .catch((err) => {
          alert(`local error handler: ${err.message}`);
        });
    };

    const sentLocalBodyErrorRequest = () => {
      localPluginApi.bodyError({
        catchError: true,
      });
    };

    const setnBodyErrorRequest = () => {
      userPluginApi.bodyError({
        catchError: true,
      });
    };

    // 全局注册loading
    const sendLoadingRequret = (loading = true) => {
      userApi
        .timeout({
          params: {
            countdown: 5,
          },
          loading,
        })
        .then(({ data }) => {
          alert(data);
        })
        .catch((err: Error) => {
          alert(err.message);
        });
    };

    const sendLocalLoadingWithErrorRequret = () => {
      localPluginApi
        .timeout({
          params: {
            countdown: 3,
          },
          catchError: true,
          loading: true,
        })
        .then(({ data }) => {
          alert(data);
        })
        .catch((err: Error) => {
          alert(err.message);
        });
    };

    const sendLoadingWithErrorRequret = () => {
      userPluginApi
        .timeout({
          params: {
            countdown: 3,
          },
          catchError: true,
          loading: true,
        })
        .then(({ data }) => {
          alert(data);
        })
        .catch((err: Error) => {
          alert(err.message);
        });
    };

    // 使用本地loading handler
    const localLoadingRef = ref(false);
    const sendLocalLoadingRequret = (countdown = 5) => {
      userApi
        .timeout({
          params: {
            countdown,
          },
          loading: () => {
            localLoadingRef.value = true;
            return () => {
              localLoadingRef.value = false;
            };
          },
        })
        .then(({ data }) => {
          alert(data);
        })
        .catch((err: Error) => {
          alert(err.message);
        });
    };

    // 全局注册retry
    const sendRetryRequest = (retry = true) => {
      userApi
        .getUsers({
          retry,
        })
        .then(({ data }) => {
          alert(`get ${data.length} count row(s)`);
        })
        .catch((err) => {
          alert(err.message);
        });
    };

    // 使用本地retry配置
    const sendLocalRetryRequest = () => {
      userApi
        .getUsers({
          retry: {
            maxCount: 1,
          },
        })
        .then(({ data }) => {
          alert(`get ${data.length} count row(s)`);
        })
        .catch((err) => {
          alert(err.message);
        });
    };

    // 不延时retry
    const sendNoDelayRetryRequest = () => {
      userApi
        .getUsers({
          retry: {
            maxCount: 3,
            delay: false,
          },
        })
        .then(({ data }) => {
          alert(`get ${data.length} count row(s)`);
        })
        .catch((err) => {
          alert(err.message);
        });
    };

    return () => {
      return (
        <div>
          <div>
            <small>取消请求(axios.CancelToken)：</small>
            <input type="button" value="Submit" onClick={() => sendCanceledRequest()}></input> &nbsp;
            {cancelTimeoutRef.value > 0 && (
              <div style="display:inline-block">
                <small>click </small>
                <input type="button" value="Cancel" onClick={() => cancelRequest()}></input>
                <small> within time {cancelTimeoutRef.value}s</small>
              </div>
            )}
          </div>
          <div>
            <small>取消请求(AbortController)：</small>
            <input type="button" value="Submit" onClick={() => sendAbortedRequest()}></input> &nbsp;
            {abortTimeoutRef.value > 0 && (
              <div style="display:inline-block">
                <small>click </small>
                <input type="button" value="Cancel" onClick={() => abortRequest()}></input>
                <small> within time {abortTimeoutRef.value}s</small>
              </div>
            )}
          </div>
          <div>
            <small>超时请求：</small>
            <input type="button" value="Timeout 3s" onClick={() => sendTimeoutRequest()}></input> &nbsp;
            {timeoutRef.value > 0 && <small>request will be timeout in {timeoutRef.value}s</small>}
          </div>
          <div>
            <h3>catchError（applyCatchError 到全局）</h3>
            <div>
              <small>禁用catchError，本地错误捕获提示：</small>
              <input type="button" value="Catch Error false" onClick={() => sendErrorRequest(false)}></input>
            </div>
            <div>
              <small>启用catchError, 全局错误捕获提示：</small>
              <input type="button" value="Catch Error true" onClick={() => sendErrorRequest(true)}></input>
            </div>
            <div>
              <small>client直接请求(应用在全局instance上catchError生效)：</small>
              <input
                type="button"
                value="Catch Error true(not regist api request)"
                onClick={() => sendErrorRequestWithClient()}
              ></input>
            </div>
            <h3>catchError（registCatchError 到定义的registApis 上）</h3>
            <div>
              <small>禁用catchError本地错误捕获提示：</small>
              <input type="button" value="Catch Error false" onClick={() => sendPluginFetchErrorRequest(false)}></input>
            </div>
            <div>
              <small>启用catchError全局错误捕获提示：</small>
              <input type="button" value="Catch Error true" onClick={() => sendPluginFetchErrorRequest(true)}></input>
            </div>
            <div>
              <small>client直接请求(全局instance上没有applyCatchError)：</small>
              <input
                type="button"
                value="Catch Error true(not regist api request)"
                onClick={() => sendPluginFetchErrorRequestWithClient()}
              ></input>
            </div>
            <div>
              <small>error 通过body返回(格式化错误信息)</small>
              <input type="button" value="Global Error Catch" onClick={() => setnBodyErrorRequest()}></input> &nbsp;
              <input type="button" value="Local Error Catch" onClick={() => sentLocalBodyErrorRequest()}></input>
            </div>
          </div>
          <div>
            <h3>loading</h3>
            {localLoadingRef.value && <p>Local Loading...</p>}
            {globalLoadingRef.value && <p>Global Loading...</p>}
            {pluginGlobalLoadingRef.value && <p>Global Loading...</p>}
            <div>
              <small>本地设置loading状态：</small>
              <input type="button" value="Local Loading" onClick={() => sendLocalLoadingRequret()}></input>
            </div>
            <div>
              <small>全局设置loading状态：</small>
              <input type="button" value="Global Loading" onClick={() => sendLoadingRequret(true)}></input>
            </div>
            <div>
              <small>delay内返回不显示loading状态：</small>
              <input type="button" value="No Loading" onClick={() => sendLocalLoadingRequret(0)}></input>
            </div>
            <div>
              <small>loading设置false：</small>
              <input type="button" value="No Loading（5s）" onClick={() => sendLoadingRequret(false)}></input>
            </div>
            <div>
              <small>loading与catchError混用(全局插件)：</small>
              <input type="button" value="Error loading (3s)" onClick={() => sendLoadingWithErrorRequret()}></input>
            </div>
            <div>
              <small>loading与catchError混用(本地插件)：</small>
              <input
                type="button"
                value="Error loading (3s)"
                onClick={() => sendLocalLoadingWithErrorRequret()}
              ></input>
            </div>
          </div>
          <div>
            <h3>retry(在 devtools 中关闭网络后测试)</h3>
            <div>
              <small>本地设置retry：</small>
              <input type="button" value="Local Retry(1 times)" onClick={() => sendLocalRetryRequest()}></input>
            </div>
            <div>
              <small>全局设置retry：</small>
              <input type="button" value="Global Retry(5 times)" onClick={() => sendRetryRequest(true)}></input>
            </div>
            <div>
              <small>retry设置false：</small>
              <input type="button" value="No Retry" onClick={() => sendRetryRequest(false)}></input>
            </div>
            <div>
              <small>retry.delay设置false：</small>
              <input type="button" value="No Delay Retry(3 times)" onClick={() => sendNoDelayRetryRequest()}></input>
            </div>
          </div>
          <div>
            <h3>plugins</h3>
            <div>
              <small>通过 interceptors 应用在全局的 instance 上：</small>
              <input
                type="button"
                value="Global plugin applied to all registApis"
                onClick={() => userApi.error400({ catchError: true })}
              ></input>
            </div>
            <div>
              <small>通过插件应用在 registApis 上：</small>
              <input
                type="button"
                value="Plugin applied to current registApis"
                onClick={() => localPluginApi.error400({ catchError: true })}
              ></input>
            </div>
          </div>
        </div>
      );
    };
  },
});
