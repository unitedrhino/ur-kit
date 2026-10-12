<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem v-for="(item, index) in config.series" :key="index" :name="editorT('bigscreenEditor.ui.componentRing')" :expanded="true">
    <SettingItemBox :name="editorT('orgMall.devices.excelSheet')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPercentageMode')">
        <n-switch v-model:value="config.percentMode" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.value')">
        <n-input-number
          v-model:value="config.dataset"
          :min="0"
          :max="config.percentMode ? 1 : undefined"
          :step="config.percentMode ? 0.01 : 1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterValue')"
        />
      </SettingItem>
      <SettingItem v-if="!config.percentMode" :name="editorT('orgManage.flow.propMax')">
        <n-input-number v-model:value="config.maxValue" :min="1" :step="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterMaximumValue')" />
      </SettingItem>
      <SettingItem v-if="!config.percentMode" :name="editorT('iotApp.schemaForm.unitLabel')">
        <n-input v-model:value="config.unit" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEGKWhDevices2')" />
      </SettingItem>
      <n-text v-if="!config.percentMode && config.autoUnit" depth="3" style="font-size: 12px; padding: 0 12px; display: block">
        {{ editorT('bigscreenEditor.ui.componentDetectedUnit') }}{{ config.autoUnit }}
      </n-text>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDecimalPlaces')">
        <n-input-number v-model:value="config.displayDecimals" :min="0" :step="1" size="small" placeholder="0" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox v-if="config.title" :name="editorT('orgManage.approve.colTitle')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="config.title.textStyle.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number v-model:value="config.title.textStyle.fontSize" :min="0" :step="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentFontSize')" />
      </SettingItem>
    </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentProgressBar')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          :value="item.data?.[0]?.itemStyle.color"
          @update:value="(value) => updatePieItemStyle(item, 0, 'color', value)"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowBlur')">
        <n-input-number
          :value="item.data?.[0]?.itemStyle.shadowBlur"
          @update:value="(value) => updatePieItemStyle(item, 0, 'shadowBlur', value)"
          :min="0"
          :max="50"
          :step="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentShadowBlur')"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowColor2')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          :value="item.data?.[0]?.itemStyle.shadowColor"
          @update:value="(value) => updatePieItemStyle(item, 0, 'shadowColor', value)"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTrack')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          :value="item.data?.[1]?.itemStyle.color"
          @update:value="(value) => updatePieItemStyle(item, 1, 'color', value)"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowBlur')">
        <n-input-number
          :value="item.data?.[1]?.itemStyle.shadowBlur"
          @update:value="(value) => updatePieItemStyle(item, 1, 'shadowBlur', value)"
          :min="0"
          :step="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentShadowBlur')"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShadowColor2')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          :value="item.data?.[1]?.itemStyle.shadowColor"
          @update:value="(value) => updatePieItemStyle(item, 1, 'shadowColor', value)"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTrackWidth')">
        <n-select v-model:value="item.radius[0]" size="small" :options="radiusOptions" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.componentConditionalStyles')" :expanded="false">
    <SettingItemBox :name="editorT('orgManage.common.enabled')">
      <n-switch v-model:value="config.conditionalStyles.enabled" size="small" />
    </SettingItemBox>

    <template v-if="config.conditionalStyles.enabled">
      <div
        v-for="(rule, ruleIndex) in config.conditionalStyles.rules"
        :key="rule.id"
        style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px; padding: 0 12px"
      >
        <n-select v-model:value="rule.operator" :options="operatorOptions" size="small" style="width: 70px" />
        <n-input-number v-model:value="rule.value" size="small" style="width: 80px" />
        <n-color-picker
          v-model:value="rule.color"
          size="small"
          :show-alpha="false"
          :swatches="['#00ff00', '#ffff00', '#ff0000', '#999999']"
          style="width: 60px"
        />
        <n-button size="tiny" quaternary @click="config.conditionalStyles.rules.splice(ruleIndex, 1)">×</n-button>
      </div>

      <div style="padding: 0 12px">
        <n-button size="small" dashed block @click="addRule">{{ editorT('orgManage.cloneGroup.addRule') }}</n-button>
      </div>

      <n-text depth="3" style="font-size: 12px; padding: 4px 12px; display: block"> {{ editorT('bigscreenEditor.ui.componentMatchingRulesOverrideBothTheCenterTextColor') }} </n-text>
    </template>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, type PropType, watch } from 'vue';

import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting';
import type { GlobalThemeJsonType } from '@/settings/chartThemes';
import { getUUID } from '@/utils';

const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true,
  },
});

const config = computed(() => props.optionData as any);

watch(
  () => config.value.percentMode,
  (enabled) => {
    if (enabled && Number(config.value.dataset) > 1) {
      config.value.dataset = 1;
    }
    if (enabled && config.value.unitAutoApplied) {
      config.value.unit = '';
      config.value.autoUnit = '';
      config.value.unitAutoApplied = false;
    }
    if (!enabled && Number(config.value.maxValue) <= 0) {
      config.value.maxValue = 100;
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => config.value.unit,
  (nextUnit) => {
    if (config.value.percentMode) return;
    config.value.unitAutoApplied = !!config.value.autoUnit && nextUnit === config.value.autoUnit;
  },
);

const radiusOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentNarrow'); }, value: '75%' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentMedium'); }, value: '60%' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.width'); }, value: '45%' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentWider'); }, value: '30%' },
];

const operatorOptions = [
  { label: '>', value: 'gt' },
  { label: '<', value: 'lt' },
  { label: '>=', value: 'gte' },
  { label: '<=', value: 'lte' },
  { label: '=', value: 'eq' },
];

const addRule = () => {
  config.value.conditionalStyles.rules.push({
    id: getUUID(),
    operator: 'gt',
    value: 0,
    color: '#ff0000',
  });
};

const updatePieItemStyle = (item: any, index: 0 | 1, key: 'color' | 'shadowBlur' | 'shadowColor', value: any) => {
  if (!item.data?.[index]?.itemStyle) return;
  item.data[index].itemStyle[key] = value;
};
</script>
