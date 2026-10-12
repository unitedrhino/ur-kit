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
            <request-target-config :target-data-request="targetData?.request"></request-target-config>
          </n-space>
        </div>
      </n-scrollbar>
      <!-- 底部 -->
      <template #action>
        <n-space justify="space-between">
          <div>
            <n-text>「 {{ chartConfig.categoryName }} 」</n-text>
            <n-text>—— </n-text>
            <n-tag type="primary" :bordered="false" style="border-radius: 5px">
              {{ requestContentTypeObj[requestContentType] }}
            </n-tag>
          </div>
          <div>
            <n-button class="go-mr-3" @click="closeHandle">{{ editorT('orgManage.common.cancel') }}</n-button>
            <n-button type="primary" @click="closeAndSendHandle"> {{ saveBtnText || editorT('bigscreenEditor.ui.saveSendRequest') }}</n-button>
          </div>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<script script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { ref, toRefs, type PropType, watch } from 'vue';
import { RequestContentTypeEnum } from '@/enums/httpEnum';
import { useTargetData } from '../../../hooks/useTargetData.hook';
import { RequestGlobalConfig } from './components/RequestGlobalConfig';
import { RequestTargetConfig } from './components/RequestTargetConfig';
import type { CreateComponentType, CreateComponentGroupType } from '@/packages/index.type';

const props = defineProps({
  modelShow: Boolean,
  targetData: Object as PropType<CreateComponentType>,
  saveBtnText: String || null,
});
const emit = defineEmits(['update:modelShow', 'sendHandle']);

// 解构基础配置
const { chartConfig } = toRefs(props.targetData as CreateComponentType);
const { requestContentType } = toRefs((props.targetData as CreateComponentType).request);
const modelShowRef = ref(false);
const requestContentTypeObj = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [RequestContentTypeEnum.DEFAULT]() { return editorT('bigscreenEditor.ui.standardRequest'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [RequestContentTypeEnum.SQL]() { return editorT('bigscreenEditor.ui.sqlRequest'); },
};

watch(
  () => props.modelShow,
  (newValue) => {
    modelShowRef.value = newValue;
  },
  {
    immediate: true,
  },
);

const closeHandle = () => {
  emit('update:modelShow', false);
};

const closeAndSendHandle = () => {
  emit('update:modelShow', false);
  emit('sendHandle');
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
