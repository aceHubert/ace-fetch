import React from 'react';
import { FetchContext, setActiveFetch } from './context';

// Types
import type { Fetch } from '../types';
export const FetchProvider: React.FC<{
  fetch: Fetch;
  children?: React.ReactNode;
}> = (props) => {
  // this allows calling useFetch() outside of a component setup after
  setActiveFetch(props.fetch);

  return <FetchContext.Provider value={{ fetch: props.fetch }}>{props.children}</FetchContext.Provider>;
};
