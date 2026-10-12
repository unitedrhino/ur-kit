<template>
<app-navigation-bar :title="title" :back="true" />

<view v-if="url" class="legal-page">
  <web-view :src="url" @Error="handleLoadError" />
</view>

<view v-else class="legal-empty">
  <text class="legal-empty__text">协议链接未配置</text>
</view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { findLegalDoc } from '../../../config/brand';

const title = ref('协议');
const url = ref('');

onLoad((query: Record<string, string | undefined> | undefined) => {
  const key = (query && query.key) || '';
  const doc = findLegalDoc(key);
  if (doc) {
    title.value = doc.title;
    url.value = doc.url;
    uni.setNavigationBarTitle({ title: doc.title });
  } else {
    title.value = '协议未找到';
    url.value = '';
  }
});

function handleLoadError() {
  uni.showToast({ title: '协议页面加载失败', icon: 'none' });
}
</script>

<style lang="scss" scoped>
.legal-page {
  flex: 1;
  height: 100vh;
}

.legal-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
}

.legal-empty__text {
  font-size: 14px;
  color: var(--text-secondary);
}

</style>
