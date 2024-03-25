import { isPlainObject, isArray, isUndef } from '@ace-util/core';
import { RequestConfig } from '@ace-fetch/core';
import { forEach, merge } from '../utils';

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 *
 * @returns {Object} New object resulting from merging config2 to config1
 */
export function mergeConfig(config1: Partial<RequestConfig>, config2: Partial<RequestConfig>) {
  config2 = config2 || {};
  const config: Partial<RequestConfig> = {};

  function getMergedValue(target: any, source: any) {
    if (isPlainObject(target) && isPlainObject(source)) {
      return merge(target, source);
    } else if (isPlainObject(source)) {
      return merge({}, source);
    } else if (isArray(source)) {
      return source.slice();
    }
    return source;
  }

  function mergeDeepProperties(prop: keyof RequestConfig) {
    if (!isUndef(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!isUndef(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  function valueFromConfig2(prop: keyof RequestConfig) {
    if (!isUndef(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  function defaultToConfig2(prop: keyof RequestConfig) {
    if (!isUndef(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!isUndef(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  function mergeDirectKeys(prop: keyof RequestConfig) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    headers: mergeDeepProperties,
    data: valueFromConfig2,
    timeout: defaultToConfig2,
    requestType: defaultToConfig2,
    responseType: defaultToConfig2,
    sslVerify: defaultToConfig2,
    withCredentials: defaultToConfig2,
    firstIpv4: defaultToConfig2,
    enableHttp2: defaultToConfig2,
    enableQuic: defaultToConfig2,
    enableCache: defaultToConfig2,
    enableHttpDNS: defaultToConfig2,
    httpDNSServiceId: defaultToConfig2,
    enableChunked: defaultToConfig2,
    forceCellularNetwork: defaultToConfig2,
    enableCookie: defaultToConfig2,
    cloudCache: mergeDeepProperties,
    defer: defaultToConfig2,
  };

  forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop: keyof RequestConfig) {
    const merge = mergeMap[prop as keyof typeof mergeMap] || mergeDeepProperties;
    const configValue = merge(prop);
    (isUndef(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
}
