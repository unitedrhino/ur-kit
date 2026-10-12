<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('orgManage.flow.propertyTitle')" :expanded="true">
    <setting-item-box :name="editorT('orgManage.memory.pathCol')" :alone="true">
      <setting-item :name="editorT('bigscreenEditor.ui.componentEnterAnHTTPSURL')">
        <n-input v-model:value="optionData.dataset" size="small"></n-input>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentStyle')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number
          v-model:value="optionData.borderRadius"
          size="small"
          :min="0"
          :placeholder="editorT('bigscreenEditor.ui.componentRoundedCorners')"
        ></n-input-number>
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from "vue";
import { option } from "./config";
import {
  CollapseItem,
  SettingItemBox,
  SettingItem,
} from "@/components/Pages/ChartItemSetting";

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
});
</script>
