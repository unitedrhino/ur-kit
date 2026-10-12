<script lang="ts" setup>
import { onMounted } from 'vue';

import router from '@/router';
// 重新加载前路径页面
onMounted(() => {
  router.go(-1);
});
</script>

<template>
  <div class="go-reload"></div>
</template>

<style lang="scss" scoped>
@include go('reload') {
  width: 100vw;
  height: 100vh;

  @include fetch-bg-color('background-color');
}
</style>
