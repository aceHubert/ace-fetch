import { createContext, useContext } from 'react';

// Types
import type { Fetch, FetchConsumerProps } from '../types';

/**
 * activeFetch must be called to handle SSR at the top of functions like
 * `fetch`, `setup`, `serverPrefetch` and others
 */
export let activeFetch: Fetch | undefined;

/**
 * fetch context
 */
export const FetchContext = createContext<FetchConsumerProps>({});

/**
 * Set or unset active fetch, Used in SSR and internally when calling
 * actions and getters
 * @param fetch Fetch instance
 */
export const setActiveFetch = (fetch: Fetch | undefined) => (activeFetch = fetch);

/**
 * Get the currently active fetch if there is any.
 */
export const getActiveFetch = () => useContext(FetchContext).fetch || activeFetch;
