<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, ref, watch } from 'vue';

import FieldHint from './FieldHint.vue';
import { filterFieldOptions, formatSelectedSummary, getSelectedLabels } from './fieldSelector';

export interface FieldOption {
  label: string;
  value: string;
}

const TEXT = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get clear() { return editorT('orgManage.common.clearAll'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get empty() { return editorT('bigscreenEditor.ui.noAvailableFields'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return editorT('bigscreenEditor.ui.selectField'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get search() { return editorT('bigscreenEditor.ui.searchFields'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get searchEmpty() { return editorT('bigscreenEditor.ui.noFieldsMatchCurrentSearch'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get selected() { return editorT('aiChat.ui.selected_f24ddc'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.fieldSelection'); },
} as const;

const props = withDefaults(
  defineProps<{
    options: FieldOption[];
    modelValue: string[];
    title?: string;
    hint?: string;
    multiple?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyText?: string;
    loading?: boolean;
    placeholder?: string;
    compact?: boolean;
    triggerWidth?: string;
  }>(),
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.fieldSelection'); },
    hint: '',
    multiple: true,
    searchable: false,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get searchPlaceholder() { return editorT('bigscreenEditor.ui.searchFields'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get emptyText() { return editorT('bigscreenEditor.ui.noAvailableFields'); },
    loading: false,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return editorT('bigscreenEditor.ui.selectField'); },
    compact: false,
    triggerWidth: '180px',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const panelVisible = ref(false);
const keyword = ref('');
const effectiveKeyword = ref('');
let keywordTimer: null | ReturnType<typeof setTimeout> = null;

watch(
  () => keyword.value,
  (value) => {
    if (keywordTimer) clearTimeout(keywordTimer);
    keywordTimer = setTimeout(() => {
      effectiveKeyword.value = value;
    }, 120);
  },
);

const filteredOptions = computed(() => filterFieldOptions(props.options, effectiveKeyword.value));
const selectedLabels = computed(() => getSelectedLabels(props.options, props.modelValue));
const selectedSummary = computed(() => formatSelectedSummary(props.options, props.modelValue, 2));
const selectedCount = computed(() => props.modelValue.length);
const radioValue = computed(() => props.modelValue[0] ?? null);
const triggerStyle = computed(() => ({ minWidth: props.triggerWidth, width: props.triggerWidth }));

const triggerText = computed(() => {
  if (selectedCount.value === 0) return props.placeholder;
  if (!props.multiple) return selectedLabels.value[0] || props.placeholder;
  return `${TEXT.selected} ${selectedCount.value} \u9879: ${selectedSummary.value}`;
});

const summaryText = computed(() => `${TEXT.selected} ${selectedCount.value} \u9879`);
const showSearchEmpty = computed(() => !props.loading && props.options.length > 0 && keyword.value.trim() && filteredOptions.value.length === 0);
const showDataEmpty = computed(() => !props.loading && props.options.length === 0);

const onClear = () => {
  emit('update:modelValue', []);
  if (!props.multiple) panelVisible.value = false;
};

const onCheckboxUpdate = (value: string[]) => {
  emit('update:modelValue', value);
};

const onRadioUpdate = (value: string) => {
  emit('update:modelValue', value ? [value] : []);
  panelVisible.value = false;
};
</script>

<template>
  <div class="field-selector" :class="{ 'field-selector--compact': compact }">
    <template v-if="compact">
      <div class="field-selector__compact-row">
        <n-text depth="3" class="field-selector__compact-label">{{ title }}</n-text>

        <n-popover v-model:show="panelVisible" trigger="click" placement="bottom-start" :show-arrow="false" style="padding: 0">
          <template #trigger>
            <div class="field-selector__trigger" :style="triggerStyle">
              <div class="field-selector__trigger-text">
                <n-text v-if="selectedCount === 0" depth="3">{{ triggerText }}</n-text>
                <template v-else>
                  <n-tag size="small" type="info" round>{{ selectedCount }}</n-tag>
                  <n-text>{{ triggerText }}</n-text>
                </template>
              </div>
              <span class="field-selector__arrow" />
            </div>
          </template>

          <div class="field-selector__panel">
            <div v-if="searchable" class="field-selector__search">
              <n-input v-model:value="keyword" clearable size="small" :placeholder="searchPlaceholder" />
            </div>

            <div v-if="multiple && selectedCount > 0" class="field-selector__summary">
              <n-space align="center" justify="space-between">
                <n-text depth="3" style="font-size: 12px">{{ summaryText }}</n-text>
                <n-button text size="tiny" type="error" @click="onClear">{{ TEXT.clear }}</n-button>
              </n-space>
            </div>

            <div class="field-selector__content">
              <div v-if="loading" class="field-selector__loading">
                <n-skeleton text :repeat="4" />
              </div>

              <template v-else-if="filteredOptions.length > 0">
                <n-checkbox-group v-if="multiple" :value="modelValue" @update:value="onCheckboxUpdate">
                  <n-space vertical :size="6" style="width: 100%">
                    <n-checkbox v-for="opt in filteredOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                  </n-space>
                </n-checkbox-group>

                <n-radio-group v-else :value="radioValue" @update:value="onRadioUpdate">
                  <n-space vertical :size="6" style="width: 100%">
                    <n-radio v-for="opt in filteredOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                  </n-space>
                </n-radio-group>
              </template>

              <n-empty v-else-if="showSearchEmpty" size="small" :description="TEXT.searchEmpty" />
              <n-empty v-else-if="showDataEmpty" size="small" :description="emptyText" />
            </div>
          </div>
        </n-popover>

        <FieldHint v-if="hint" :text="hint" />
      </div>
    </template>

    <template v-else>
      <div v-if="title" class="field-selector__header">
        <n-space align="center" :size="6">
          <n-text depth="3">{{ title }}</n-text>
          <FieldHint v-if="hint" :text="hint" />
        </n-space>
      </div>

      <n-popover v-model:show="panelVisible" trigger="click" placement="bottom-start" :show-arrow="false" style="padding: 0">
        <template #trigger>
          <div class="field-selector__trigger field-selector__trigger--block">
            <div class="field-selector__trigger-text">
              <n-text v-if="selectedCount === 0" depth="3">{{ triggerText }}</n-text>
              <template v-else>
                <n-tag size="small" type="info" round>{{ selectedCount }}</n-tag>
                <n-text>{{ triggerText }}</n-text>
              </template>
            </div>
            <span class="field-selector__arrow" />
          </div>
        </template>

        <div class="field-selector__panel">
          <div v-if="searchable" class="field-selector__search">
            <n-input v-model:value="keyword" clearable size="small" :placeholder="searchPlaceholder" />
          </div>

          <div v-if="multiple && selectedCount > 0" class="field-selector__summary">
            <n-space align="center" justify="space-between">
              <n-text depth="3" style="font-size: 12px">{{ summaryText }}</n-text>
              <n-button text size="tiny" type="error" @click="onClear">{{ TEXT.clear }}</n-button>
            </n-space>
          </div>

          <div class="field-selector__content">
            <div v-if="loading" class="field-selector__loading">
              <n-skeleton text :repeat="4" />
            </div>

            <template v-else-if="filteredOptions.length > 0">
              <n-checkbox-group v-if="multiple" :value="modelValue" @update:value="onCheckboxUpdate">
                <n-space vertical :size="6" style="width: 100%">
                  <n-checkbox v-for="opt in filteredOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                </n-space>
              </n-checkbox-group>

              <n-radio-group v-else :value="radioValue" @update:value="onRadioUpdate">
                <n-space vertical :size="6" style="width: 100%">
                  <n-radio v-for="opt in filteredOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                </n-space>
              </n-radio-group>
            </template>

            <n-empty v-else-if="showSearchEmpty" size="small" :description="TEXT.searchEmpty" />
            <n-empty v-else-if="showDataEmpty" size="small" :description="emptyText" />
          </div>
        </div>
      </n-popover>
    </template>
  </div>
</template>

<style scoped>
.field-selector {
  width: 100%;
}

.field-selector__compact-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.field-selector__compact-label {
  min-width: 56px;
}

.field-selector__header {
  margin-bottom: 6px;
}

.field-selector__trigger {
  min-height: 32px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 3px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.02);
}

.field-selector__trigger--block {
  width: 100%;
}

.field-selector__trigger-text {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}

.field-selector__arrow {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid rgba(255, 255, 255, 0.45);
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.45);
  transform: rotate(45deg) translateY(-2px);
  flex-shrink: 0;
}

.field-selector__panel {
  width: 320px;
  max-width: 100%;
}

.field-selector__search {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 10px 8px;
  background: #2a2a2a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.field-selector__summary {
  padding: 8px 10px 0;
}

.field-selector__content {
  max-height: 280px;
  overflow-y: auto;
  padding: 10px;
}

.field-selector__loading {
  padding: 4px 0;
}
</style>
