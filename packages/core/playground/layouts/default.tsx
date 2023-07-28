import { defineComponent } from 'vue-demi';

export default defineComponent({
  name: 'Layout',
  setup(_, { slots }) {
    return () => <div style="width:1000px;margin:auto;">{slots.default?.()}</div>;
  },
});
