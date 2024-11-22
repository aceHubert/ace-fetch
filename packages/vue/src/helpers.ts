import type { Ref } from 'vue-demi';
import type { LoadingHandler } from '@ace-fetch/core';

export function toRefLoading(loading: Ref<boolean>): LoadingHandler {
  return (value: boolean) => {
    loading.value = value;
  };
}
