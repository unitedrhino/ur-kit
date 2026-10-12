<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, ref, watch } from 'vue';

import { SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting';
import { useTargetData } from '../../../hooks/useTargetData.hook';

const { targetData } = useTargetData();

// 字段选项（配置面板不在 EditGroup 组件树内，无法通过 inject 获取）
// 目前留空，后续 Group 级数据源配置完成后可从 store 中提取字段列表
const fieldOptions = computed(() => {
  return [];
});

// 初始化子组件的字段映射配置
if (!targetData.value.option.childDataMapping) {
  targetData.value.option.childDataMapping = { sourceField: '' };
}

// v-model 绑定
const sourceField = computed({
  get: () => targetData.value.option.childDataMapping?.sourceField || '',
  set: (val) => {
    if (!targetData.value.option.childDataMapping) {
      targetData.value.option.childDataMapping = { sourceField: '' };
    }
    targetData.value.option.childDataMapping.sourceField = val;
  },
});

// 手动输入的路径
const customPath = ref('');
watch(sourceField, (val) => {
  customPath.value = val;
});

// 处理下拉选择
const handleSelectChange = (val: string) => {
  sourceField.value = val;
  customPath.value = val;
};

// 处理手动输入
const handleInputChange = (val: string) => {
  sourceField.value = val;
};
</script>

<template>
  <div class="go-child-data-mapping">
    <!-- 数据来源：固定显示"父级数据注入" -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.dataSource')" :alone="true">
      <n-tag type="info" :bordered="false">{{ editorT('bigscreenEditor.ui.parentDataInjection') }}</n-tag>
    </SettingItemBox>

    <!-- 提取路径 -->
    <SettingItemBox :name="editorT('bigscreenEditor.ui.extractionPath')" :alone="true">
      <n-space vertical :size="12">
        <!-- 下拉选择：显示可用字段 -->
        <n-select
          v-model:value="sourceField"
          :options="fieldOptions"
          :placeholder="editorT('bigscreenEditor.ui.selectFieldOrEnterPath')"
          clearable
          filterable
          tag
          @update:value="handleSelectChange"
        />
        <!-- 手动输入：允许输入点语法路径 -->
        <n-input v-model:value="customPath" :placeholder="editorT('bigscreenEditor.ui.enterDotPathEGDeviceAMetricsTemp')" @update:value="handleInputChange">
          <template #suffix>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon class="cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                </n-icon>
              </template>
              {{ editorT('bigscreenEditor.ui.useDotPathsSuchAsDeviceAMetricsTemp') }}
            </n-tooltip>
          </template>
        </n-input>
      </n-space>
    </SettingItemBox>
  </div>
</template>

<style lang="scss" scoped>
.go-child-data-mapping {
  width: 100%;
}
</style>
