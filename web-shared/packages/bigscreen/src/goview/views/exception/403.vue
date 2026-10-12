<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div class="go-error">
    <div class="text-center">
      <img src="~@/assets/images/exception/403.svg" alt="" />
    </div>
    <div class="text-center">
      <h1 class="text-base text-gray-500">{{ editorT('bigscreenEditor.ui.helperYouDoNotHavePermissionToAccessThisPage') }}</h1>
    </div>
    <n-button type="primary" @click="goHome">{{ editorT('bigscreenEditor.ui.helperReturnHome') }}</n-button>
  </div>
</template>

<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { PageEnum } from '@/enums/pageEnum'
import { routerTurnByName } from '@/utils'
function goHome() {
  routerTurnByName(PageEnum.BASE_HOME_NAME)
}
</script>

<style lang="scss" scoped>
@include go(error) {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding: 100px 0;
  @include background-image('background-image');
  .text-center {
    h1 {
      color: #666;
      padding: 20px 0;
    }
  }

  img {
    width: 350px;
    margin: 0 auto;
  }
}
</style>
