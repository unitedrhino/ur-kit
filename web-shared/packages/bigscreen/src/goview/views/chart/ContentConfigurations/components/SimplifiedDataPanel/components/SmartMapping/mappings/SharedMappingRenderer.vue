<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { MappingRendererProps } from './types';

defineProps<MappingRendererProps>();
</script>

<template>
  <template v-if="schema.mode === 'none'">
    <n-text depth="3">{{ editorT('bigscreenEditor.ui.thisChartNeedsNoAdditionalMappingConfiguration') }}</n-text>
  </template>

  <n-space v-else-if="schema.mode === 'flat'" vertical :size="8">
    <div v-for="field in schema.fields" :key="field.key" class="mapping-row">
      <div class="mapping-label">
        <n-text>{{ field.label }}</n-text>
      </div>
      <div class="mapping-control">
        <n-select
          v-if="field.multiple"
          :value="getMultiValue(field)"
          :options="getSelectOptions(field)"
          :disabled="readonly"
          multiple
          clearable
          max-tag-count="responsive"
          @update:value="(value: string[]) => setFieldValue(field, value)"
        />
        <n-select
          v-else
          :value="getSingleValue(field)"
          :options="getSelectOptions(field)"
          :disabled="readonly"
          clearable
          @update:value="(value: string | null) => setFieldValue(field, value)"
        />
        <n-tag size="small" :type="getFieldStatusType(field)" :bordered="false">
          {{ getFieldStatusText(field) }}
        </n-tag>
      </div>
    </div>
  </n-space>

  <n-collapse v-else :expanded-names="activeGroupNames" @update:expanded-names="(names: string[]) => setActiveGroupNames(names)">
    <n-collapse-item v-for="group in schema.groups" :key="group.key" :name="group.key" :title="group.title">
      <template #header-extra>
        <n-tag size="small" :bordered="false">{{ getGroupRowsCount(group.key) }} {{ editorT('aiChat.ui.bar') }}</n-tag>
      </template>

      <n-space vertical :size="8">
        <div v-for="field in group.fields" :key="`${group.key}-${field.key}`" class="mapping-row">
          <div class="mapping-label">
            <n-text>{{ field.label }}</n-text>
          </div>
          <div class="mapping-control">
            <n-select
              v-if="field.multiple"
              :value="getMultiValue(field, group.key)"
              :options="getSelectOptions(field, group.key)"
              :disabled="readonly"
              multiple
              clearable
              max-tag-count="responsive"
              @update:value="(value: string[]) => setFieldValue(field, value, group.key)"
            />
            <n-select
              v-else
              :value="getSingleValue(field, group.key)"
              :options="getSelectOptions(field, group.key)"
              :disabled="readonly"
              clearable
              @update:value="(value: string | null) => setFieldValue(field, value, group.key)"
            />
            <n-tag size="small" :type="getFieldStatusType(field, group.key)" :bordered="false">
              {{ getFieldStatusText(field, group.key) }}
            </n-tag>
          </div>
        </div>
      </n-space>
    </n-collapse-item>
  </n-collapse>
</template>

<style scoped lang="scss">
.mapping-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mapping-label {
  flex: 0 0 110px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  white-space: nowrap;
}

.mapping-control {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
}

.mapping-control :deep(.n-base-selection) {
  flex: 1;
  min-width: 0;
}
</style>
