<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { ConfigType } from '@/packages/index.type';

import type { PropType } from 'vue';

import { SettingItemBox } from '@/components/Pages/ChartItemSetting';

const props = defineProps({
  chartConfig: {
    type: Object as PropType<ConfigType>,
    required: true,
  },
});

let valueCatch = '';

const handleFocus = () => {
  valueCatch = props.chartConfig.title;
};

const handleBlur = () => {
  if (props.chartConfig.title.length === 0) {
    window.$message.warning(editorT('bigscreenEditor.ui.enterAtLeastOneCharacter'));
    props.chartConfig.title = valueCatch;
  }
};
</script>

<template>
  <SettingItemBox :name="editorT('orgManage.agent.name')" :alone="true">
    <n-input
      type="text"
      maxlength="12"
      minlength="1"
      :placeholder="editorT('bigscreenEditor.ui.enterChartName')"
      size="small"
      clearable
      show-count
      v-model:value="chartConfig.title"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </SettingItemBox>
</template>
