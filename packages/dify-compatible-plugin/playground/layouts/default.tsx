import { defineComponent } from 'vue-demi';

export default defineComponent({
  name: 'Layout',
  setup(_, { slots }) {
    return () => (
      <div style="width:1000px;margin:auto;">
        <h1>stream message:</h1>
        {slots.default?.()}
      </div>
    );
  },
});
