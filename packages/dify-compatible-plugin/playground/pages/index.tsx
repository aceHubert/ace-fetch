import { defineComponent, ref } from 'vue-demi';
import { useChatApi } from '../apis/useChatApi';

export default defineComponent({
  name: 'Playground',
  setup() {
    const config = useRuntimeConfig();
    console.log('config', config.public.apiKey);
    const chatApi = useChatApi();
    const input = ref('');
    const thought = ref('');
    const message = ref('');

    const handleSend = async () => {
      thought.value = '';
      message.value = '';
      chatApi
        .sendMsg({
          data: {
            inputs: { site: '1', hospital_name: '2' },
            query: input.value,
            // conversation_id: '6ec68a80-85a8-4468-adea-160de520e91d',
            user: 'd4abca9e-b24c-4a71-a830-e45e7c7f197f',
            response_mode: 'streaming',
          },
          onData: (data) => {
            message.value += data;
          },
          onThought: (data) => {
            thought.value += data;
          },
        })
        .then((res) => {
          input.value = '';
        });
    };

    return () => {
      return (
        <div>
          <div>
            <input type="text" v-model={input.value} style="width: 220px;" />
            <button type="button" onClick={() => handleSend()} style="margin-left: 10px;">
              Send
            </button>
          </div>
          <div>
            {thought.value && <p>{thought.value}</p>}
            {message.value && <p>{message.value}</p>}
          </div>
        </div>
      );
    };
  },
});
