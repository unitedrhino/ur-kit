<!-- 文件说明：编辑器单项配置的标签置于控件上方，避免长标签与邻列错位。 -->
<script setup lang="ts">
/** name 为控件标签，width 可指定宽度；默认插槽承载表单控件。 */
defineProps({
  name: {
    type: String,
    required: false,
  },
  width: {
    type: Number,
    required: false,
  },
});
</script>

<template>
  <div class="go-setting-item" :style="{ width: `${width}px` }">
    <n-text v-if="name" class="name" depth="3">{{ name }}</n-text>
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
@include go(setting-item) {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-bottom: 5px;
  text-align: start;

  .name {
    margin-bottom: 4px;
    overflow-wrap: anywhere;
  }
}
</style>
