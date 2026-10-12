<!-- 应用未找到页面：用于当前访问应用不存在时展示轻量提示。 -->
<script setup lang="ts">
import { $t } from '@vben/locales';

defineOptions({ name: 'AppNotFound' });
</script>

<template>
  <div class="app-not-found">
    <section class="app-not-found__card" aria-labelledby="app-not-found-title">
      <img class="app-not-found__image" src="../assets/images/app-not-found.png" alt="" />
      <h1 id="app-not-found-title" class="app-not-found__title">{{ $t('orgIotClient.notFound.title') }}</h1>
      <p class="app-not-found__desc">{{ $t('orgIotClient.notFound.desc') }}</p>
    </section>
  </div>
</template>

<style scoped>
.app-not-found {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f2f6fb;
}

.app-not-found__card {
  width: min(100%, 500px);
  padding: 56px 36px 72px;
  text-align: center;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 18px 45px rgb(31 45 61 / 10%);
}

.app-not-found__image {
  display: block;
  width: min(100%, 320px);
  height: auto;
  margin: 0 auto 28px;
}

.app-not-found__title {
  margin: 0;
  color: #2f2f2f;
  font-size: 42px;
  font-weight: 500;
  line-height: 1.2;
}

.app-not-found__desc {
  margin: 16px 0 0;
  color: #606266;
  font-size: 15px;
  line-height: 1.6;
}
</style>
