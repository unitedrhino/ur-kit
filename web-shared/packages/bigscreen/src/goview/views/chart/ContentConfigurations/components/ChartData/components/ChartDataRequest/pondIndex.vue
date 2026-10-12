<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-modal class="go-chart-data-request" v-model:show="modelShowRef" :mask-closable="false" :closeOnEsc="true" :onEsc="onEsc">
    <n-card :bordered="false" role="dialog" size="small" aria-modal="true" style="width: 1000px; height: 800px">
      <template #header></template>
      <template #header-extra> </template>
      <n-scrollbar style="max-height: 718px">
        <div class="go-pr-3">
          <n-space vertical>
            <request-global-config></request-global-config>
            <request-target-config :target-data-request="targetDataRequest?.dataPondRequestConfig"></request-target-config>
          </n-space>
        </div>
      </n-scrollbar>
      <!-- 底部 -->
      <template #action>
        <n-space justify="space-between">
          <n-space v-if="targetDataRequest">
            <n-tag :bordered="false" type="primary">{{ editorT('bigscreenEditor.ui.name2') }}</n-tag>
            <n-input
              v-model:value="targetDataRequest.dataPondName"
              ref="inputInstRef"
              type="text"
              size="small"
              :autofocus="true"
              :clearable="true"
              :minlength="1"
              :maxlength="16"
              :placeholder="editorT('iotApp.dataFlow.namePh')"
            ></n-input>
          </n-space>
          <span v-else></span>
          <n-space>
            <n-button @click="closeHandle">{{ editorT('orgManage.common.cancel') }}</n-button>
            <n-button type="primary" @click="closeAndSendHandle">{{ editorT('orgManage.common.save') }}</n-button>
          </n-space>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<script script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, ref, watch } from 'vue';
import { RequestContentTypeEnum } from '@/enums/httpEnum';
import { useTargetData } from '../../../hooks/useTargetData.hook';
import { RequestGlobalConfig } from './components/RequestGlobalConfig';
import { RequestTargetConfig } from './components/RequestTargetConfig';
import type { RequestDataPondItemType } from '@/store/modules/chartEditStore/chartEditStore.type';
import { goDialog } from '@/utils';

const props = defineProps({
  modelShow: Boolean,
  targetDataRequest: Object as PropType<RequestDataPondItemType>,
});
const emit = defineEmits(['update:modelShow', 'editSaveHandle']);

const pondName = ref();
const inputInstRef = ref();
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

const closeAndSendHandle = () => {
  if (!props.targetDataRequest?.dataPondName) {
    window.$message.warning(editorT('bigscreenEditor.ui.enterNameLowerLeftCorner'));
    inputInstRef.value?.focus();
    return;
  }
  goDialog({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get message() { return editorT('bigscreenEditor.ui.savingWillUpdateAllComponentsUsingThisAPI'); },
    isMaskClosable: true,
    transformOrigin: 'center',
    onPositiveCallback: () => {
      emit('update:modelShow', false);
      emit('editSaveHandle', props.targetDataRequest);
    },
  });
};

const onEsc = () => {
  closeHandle();
};
</script>

<style lang="scss" scoped>
@include go('chart-data-request') {
  &.n-card.n-modal,
  .n-card {
    @extend .go-background-filter;
  }
  .n-card-shallow {
    background-color: rgba(0, 0, 0, 0) !important;
  }
  @include deep() {
    & > .n-card__content {
      padding-right: 0;
    }
    .n-card__content {
      padding-bottom: 5px;
    }
  }
}
</style>
