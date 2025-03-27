import axios from 'axios';
import { typedUrl } from '@ace-fetch/core';
import { defineRegistApi } from '@ace-fetch/vue';
import { createDifyStreamReadPlugin } from '@ace-fetch/dify-compatible-plugin';

export const useChatApi = defineRegistApi('plugin', {
  apis: {
    sendMsg: typedUrl<ReadableStream, any, any>({
      responseType: 'stream',
      adapter: 'fetch',
    })`post /chat-messages`,
  },
  prefix: '/dify',
  plugins: [createDifyStreamReadPlugin()],
});
