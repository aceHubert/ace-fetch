export let debug: boolean = process.env.NODE_ENV !== 'production';

/**
 * 调试打印日志, 默认为在开发模式下启用
 */
export const setDebug = (status: boolean) => (debug = status);
