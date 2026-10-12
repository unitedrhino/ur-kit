<script lang="ts" setup>
import type { AppThemeColorType } from '@/store/modules/designStore/designStore.type';

import type { PropType } from 'vue';

import designColorRecommend from '@/settings/designColorRecommend.json';

defineProps({
  designColor: {
    type: Object as PropType<AppThemeColorType[]>,
    required: true,
  },
});
const emits = defineEmits(['colorSelectHandle']);
const colorSelectHandle = (color: AppThemeColorType) => {
  emits('colorSelectHandle', color);
};
</script>

<template>
  <div class="content-left">
    <div
      class="content-left-item go-transition-quick go-mb-0"
      span="12 1000:6 1400:4 1800:4 2200:2"
      v-for="(item, index) in designColorRecommend"
      :key="index"
      @click="colorSelectHandle(item)"
    >
      <n-space>
        <div class="content-left-item-color" :style="{ backgroundColor: item.hex }"></div>
        <n-space vertical>
          <n-space>
            <span :style="{ color: item.hex }">{{ item.name }}</span>
            <span class="Pinyin-upper">{{ item.pinyin.toUpperCase() }}</span>
          </n-space>
          <n-text>
            {{ item.hex }}
            <n-divider vertical />
            {{ `rgb(${item.RGB[0]}, ${item.RGB[1]}, ${item.RGB[2]})` }}
          </n-text>
        </n-space>
      </n-space>
    </div>
    <n-divider />
    <div
      class="content-left-item go-transition-quick"
      span="12 1000:6 1400:4 1800:4 2200:2"
      v-for="(item, index) in designColor"
      :key="index"
      @click="colorSelectHandle(item)"
    >
      <n-space>
        <div class="content-left-item-color" :style="{ backgroundColor: item.hex }"></div>
        <n-space vertical>
          <n-space>
            <span :style="{ color: item.hex }">{{ item.name }}</span>
            <span class="Pinyin-upper">{{ item.pinyin.toUpperCase() }}</span>
          </n-space>
          <n-text>
            {{ item.hex }}
            <n-divider vertical />
            {{ `rgb(${item.RGB[0]}, ${item.RGB[1]}, ${item.RGB[2]})` }}
          </n-text>
        </n-space>
      </n-space>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-left {
  display: flex;
  flex-wrap: wrap;
  margin-right: 200px;

  .content-left-item {
    position: relative;
    display: flex;
    min-width: 300px;
    padding: 10px 20px;
    margin-right: 10px;
    margin-bottom: 10px;
    cursor: pointer;
    border: 1px solid rgb(0 0 0 / 0%);
    border-radius: 5px;

    &:hover {
      @include hover-border-color('background-color5');
    }

    &::after {
      @extend .go-background-filter-shallow;

      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      overflow: hidden;
      content: '';
      border-radius: 5px;
      opacity: 0.7;
      backdrop-filter: none;
    }

    &-color {
      width: 8px;
      height: 40px;
      border-radius: 2px;
    }

    .Pinyin-upper {
      font-size: 8px;
    }
  }
}
</style>
