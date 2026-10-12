<template>
<view class="safe-area" :style="`height: ${bottom}px`"></view>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSystemInfo } from '../../utils/platform';

const bottom = ref(0);
onMounted(() => {
  bottom.value = getSystemInfo().safeAreaBottom;
});
/* eslint-disable */
// import { getSystemInfo } from '../../utils/platform';
// 
// Component({
//   data: {
//     bottom: 0,
//   },
//   lifetimes: {
//     attached() {
//       this.setData({ bottom: getSystemInfo().safeAreaBottom });
//     },
//   },
// });
// 
</script>

<style lang="scss" scoped>
.safe-area {
  width: 100%;
  flex-shrink: 0;
}

</style>
