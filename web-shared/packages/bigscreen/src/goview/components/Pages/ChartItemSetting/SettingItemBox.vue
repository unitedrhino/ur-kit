<!-- 文件说明：编辑器配置分组将标签放在控件上方，支持长文案与双向文字。 -->
<script setup lang="ts">
/** name 为分组标签，alone 表示单列，itemRightStyle 提供控件布局；name 插槽补充分组提示。 */
defineProps({
  name: {
    type: String,
    required: false,
  },
  alone: {
    type: Boolean,
    default: false,
    required: false,
  },
  itemRightStyle: {
    type: Object,
    default: () => {},
    required: false,
  },
});
</script>

<template>
  <div class="go-config-item-box">
    <n-text v-if="name || $slots.name" class="item-left" depth="2">
      {{ name }}
      <n-space :size="5">
        <slot name="name"></slot>
      </n-space>
    </n-text>
    <div
      class="item-right"
      :style="{
        gridTemplateColumns: alone ? '1fr' : '1fr 1fr',
        ...itemRightStyle,
      }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>

@include go('config-item-box') {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 20px 0;

  .item-left {
    width: 100%;
    overflow-wrap: anywhere;
    font-size: 12px;
    text-align: start;
  }

  .item-right {
    display: grid;
    grid-column-gap: 10px;
    width: 100%;
    min-width: 0;
  }
}
</style>
