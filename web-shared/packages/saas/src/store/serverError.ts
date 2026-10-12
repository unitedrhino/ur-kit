import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 服务器错误状态 store
 * 用于控制全局 500 覆盖层的显示（不改变当前 URL）
 */
export const useServerErrorStore = defineStore('serverError', () => {
  const visible = ref(false);

  function show() {
    visible.value = true;
  }

  function hide() {
    visible.value = false;
  }

  function $reset() {
    visible.value = false;
  }

  return { $reset, hide, show, visible };
});
