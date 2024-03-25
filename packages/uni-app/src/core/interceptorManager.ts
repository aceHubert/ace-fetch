import { forEach } from '../utils';

// Types
import type { RequestConfig } from '@ace-fetch/core';

export interface Interceptor<V = any, T = V> {
  fulfilled?: (value: V) => T | Promise<T>;
  rejected?: (error: any) => any;
  synchronous: boolean;
  runWhen: ((config: RequestConfig) => boolean) | null;
}

export interface InterceptorOptions {
  synchronous?: boolean;
  runWhen?: (config: RequestConfig) => boolean;
}

export class InterceptorManager<V = any> {
  handlers: Array<Interceptor | null> = [];

  /**
   * Add a new interceptor to the stack
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @return {Number} An ID used to remove interceptor later
   */
  use<T = V>(
    fulfilled?: Interceptor<V, T>['fulfilled'],
    rejected?: Interceptor<V, T>['rejected'],
    options?: InterceptorOptions,
  ) {
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected,
      synchronous: options?.synchronous ?? false,
      runWhen: options?.runWhen ?? null,
    });
    return this.handlers.length - 1;
  }

  /**
   * Remove an interceptor from the stack
   * @param {Number} id The ID that was returned by `use`
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id: number) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }

  /**
   * Iterate over all the registered interceptors
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   * @param {Function} fn The function to call for each interceptor
   * @returns {void}
   */
  forEach(fn: Function) {
    forEach(this.handlers, function forEachHandler(h: any) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
