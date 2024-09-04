export let debug = process.env.NODE_ENV !== 'production';
export const setDebug = (status: boolean) => (debug = status);
