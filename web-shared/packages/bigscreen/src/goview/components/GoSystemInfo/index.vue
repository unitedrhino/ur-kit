<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { ref, watch } from 'vue';

import { icon } from '@/plugins';

const props = defineProps({
  modelShow: Boolean,
});

const emit = defineEmits(['update:modelShow']);
const { CloseIcon } = icon.ionicons5;
const modelShowRef = ref(false);

watch(
  () => props.modelShow,
  (newValue) => {
    modelShowRef.value = newValue;
  },
);

const closeHandle = () => {
  emit('update:modelShow', false);
};
</script>

<template>
  <n-modal v-model:show="modelShowRef" @after-leave="closeHandle">
    <n-list bordered class="go-system-info">
      <template #header>
        <n-space justify="space-between">
          <n-h3 class="go-mb-0">{{ editorT('bigscreenEditor.ui.aboutUs') }}</n-h3>
          <n-icon size="20" class="go-cursor-pointer" @click="closeHandle">
            <CloseIcon />
          </n-icon>
        </n-space>
      </template>

      <n-list-item>
        <n-space class="go-my-2" :size="20">
          <n-text class="item-left">{{ editorT('bigscreenEditor.ui.copyrightNotice') }}</n-text>
          <n-text>
            {{ editorT('bigscreenEditor.ui.goviewCopyrightBelongs') }}
            <n-a href="https://gitee.com/MTrun/go-view" target="_blank">https://gitee.com/MTrun/go-view</n-a> {{ editorT('bigscreenEditor.ui.projectAuthor') }}
          </n-text>
        </n-space>
      </n-list-item>

      <n-list-item>
        <n-space class="go-my-2" :size="20">
          <n-text class="item-left">{{ editorT('bigscreenEditor.ui.licenseNotes') }}</n-text>
          <n-text> {{ editorT('bigscreenEditor.ui.followOpenSourceMITLicenseNoticesAbove') }} <n-text type="error">{{ editorT('bigscreenEditor.ui.cannotBeDeleted') }}</n-text>{{ editorT('bigscreenEditor.ui.otherwiseItConsideredCopyrightInfringementAndYouBear') }} </n-text>
        </n-space>
      </n-list-item>

      <n-list-item>
        <n-space class="go-mt-2" :size="20">
          <n-text class="item-left">{{ editorT('bigscreenEditor.ui.commercialLicense') }}</n-text>
          <n-text> {{ editorT('bigscreenEditor.ui.removeCopyrightNoticeContactProjectAuthorThroughRepository') }} </n-text>
        </n-space>
      </n-list-item>
    </n-list>
  </n-modal>
</template>

<style lang="scss" scoped>
@include go('system-info') {
  @extend .go-background-filter;

  min-width: 100px;
  max-width: 60vw;
  padding-bottom: 20px;

  @include deep() {
    .n-list-item:not(:last-child) {
      border-bottom: 0;
    }
  }

  .item-left {
    width: 200px;
  }
}
</style>
