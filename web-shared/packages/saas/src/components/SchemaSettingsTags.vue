<script lang="ts" setup>
import { computed } from 'vue';
import { NPopover, NTag } from 'naive-ui';

import { $t } from '@vben/locales';
import {
  controlModeOptions,
  eventDirOptions,
  eventTypeOptions,
  funcGroupOptions,
  isPasswordOptions,
  modeOptions,
  recordModeOptions,
  sceneLinkageOptions,
  shadowTypeOptions,
} from './Affordance/constants';

export interface SchemaSettingsRow {
  type: number;
  affordance?: string | Record<string, unknown>;
  /** 功能分类: 1:普通功能 2:系统功能 */
  funcGroup?: number;
  /** 是否可以场景联动 */
  isCanSceneLinkage?: number;
}

interface SettingItem {
  label: string;
  value: string | number | boolean;
}

/** 枚举值 → 翻译键目录：常量 options 的中文 label 仅作回退，界面渲染优先走 i18n。 */
const enumTextKey: Record<string, string> = {
  // 读写类型（modeOptions）
  rw: 'iotApp.schemaTags.rw',
  r: 'iotApp.schemaTags.r',
  // 功能分类（funcGroupOptions）
  '1': 'iotApp.schemaTags.normalFunc',
  '2': 'iotApp.schemaTags.systemFunc',
  // 影子（shadowTypeOptions 的布尔值转字符串键）
  true: 'iotApp.schemaTags.on',
  false: 'iotApp.schemaTags.off',
  // 场景联动 / 密码（是/否）
  yes: 'iotApp.schemaTags.yes',
  no: 'iotApp.schemaTags.no',
};

/** translateEnumText 优先按翻译键目录返回当前语言文案，未命中保持原 label。 */
function translateEnumText(value: string | number | boolean | undefined, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  const key = enumTextKey[String(value)] ?? (value === true || value === false ? enumTextKey[String(value)] : undefined);
  return key ? $t(key) : fallback;
}

const props = withDefaults(
  defineProps<{
    row: SchemaSettingsRow;
    /** 前 N 项直接以 Tag 展示，其余放入 Popover */
    visibleCount?: number;
  }>(),
  {
    visibleCount: 10,
  },
);

function parseAffordance(row: SchemaSettingsRow): Record<string, unknown> | null {
  const raw = row?.affordance;
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  try {
    return JSON.parse(raw as string) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 仅当选项中有匹配时才返回文案，未匹配不展示原始值避免出现未翻译的 "0" 等 */
function findLabel(
  options: { value: string | number | boolean; label: string }[],
  value: string | number | boolean,
): string {
  if (value === undefined || value === null) return '';
  const v = value;
  const opt = options.find(
    (o) =>
      o.value === v ||
      String(o.value) === String(v) ||
      (typeof o.value === 'boolean' && (v === 1 || v === 0 ? (v === 1) === o.value : v === o.value)),
  );
  return opt?.label ?? '';
}

/** Tag 展示顺序：方向 → 事件 → 读写 → 记录历史 → 功能 → 场景联动 → 剩余 */
const items = computed<SettingItem[]>(() => {
  const row = props.row;
  const type = row?.type;
  const aff = parseAffordance(row);
  const out: SettingItem[] = [];

  const push = (item: SettingItem | null) => {
    if (item?.label) out.push(item);
  };

  // 1. 方向（事件/行为）
  if (aff && (type === 2 || type === 3) && aff.dir !== undefined && aff.dir !== null && aff.dir !== '') {
    const label = findLabel(eventDirOptions, aff.dir as string);
    if (label) push({ label: `${$t('iotApp.deviceDetail.direction')}: ${label}`, value: aff.dir as string });
  }

  // 2. 事件（事件类型）
  if (aff && type === 2 && aff.type !== undefined && aff.type !== null && aff.type !== '') {
    const label = findLabel(eventTypeOptions, aff.type as string);
    if (label) push({ label: `${$t('iotApp.productPage.event')}: ${label}`, value: aff.type as string });
  }

  // 3. 读写（属性 mode）
  if (aff && type === 1 && aff.mode !== undefined && aff.mode !== null && aff.mode !== '') {
    const label = findLabel(modeOptions, aff.mode as string);
    if (label) push({ label: translateEnumText(aff.mode as string, label), value: aff.mode as string });
  }

  // 4. 记录历史（属性 recordMode）
  if (aff && type === 1 && aff.recordMode !== undefined && aff.recordMode !== null) {
    const label = findLabel(recordModeOptions, aff.recordMode as number);
    if (label) push({ label, value: aff.recordMode as number });
  }

  // 5. 功能（行级 funcGroup）
  if (row.funcGroup !== undefined && row.funcGroup !== null) {
    const label = findLabel(funcGroupOptions, row.funcGroup);
    if (label) push({ label: `${$t('iotApp.schemaTags.func')}: ${translateEnumText(row.funcGroup, label)}`, value: row.funcGroup });
  }

  // 6. 场景联动（行级 isCanSceneLinkage）
  if (row.isCanSceneLinkage !== undefined && row.isCanSceneLinkage !== null) {
    const label = findLabel(sceneLinkageOptions, row.isCanSceneLinkage);
    const sceneText = row.isCanSceneLinkage === 1 ? $t('iotApp.schemaTags.yes') : $t('iotApp.schemaTags.no');
    if (label) push({ label: `${$t('iotApp.schemaTags.scene')}: ${sceneText}`, value: row.isCanSceneLinkage });
  }

  // 7. 剩余：控制模式、影子、密码等（属性）
  if (aff && type === 1) {
    if (aff.controlMode !== undefined && aff.controlMode !== null) {
      const label = findLabel(controlModeOptions, aff.controlMode as number);
      if (label) push({ label, value: aff.controlMode as number });
    }
    if (aff.isUseShadow !== undefined && aff.isUseShadow !== null) {
      const val = aff.isUseShadow;
      const label = findLabel(shadowTypeOptions, val === true || val === 1);
      const shadowText = val === true || val === 1 ? $t('iotApp.schemaTags.on') : $t('iotApp.schemaTags.off');
      if (label) push({ label: `${$t('iotApp.schemaTags.shadow')}: ${shadowText}`, value: val === true || val === 1 });
    }
    if (aff.isPassword !== undefined && aff.isPassword !== null) {
      const label = findLabel(isPasswordOptions, aff.isPassword as number);
      const passwordText = aff.isPassword === 1 ? $t('iotApp.schemaTags.yes') : $t('iotApp.schemaTags.no');
      if (label) push({ label: `${$t('iotApp.schemaTags.password')}: ${passwordText}`, value: aff.isPassword as number });
    }
  }

  return out;
});

const visibleItems = computed(() => items.value.slice(0, props.visibleCount));
const restItems = computed(() => items.value.slice(props.visibleCount));
const hasRest = computed(() => restItems.value.length > 0);
</script>

<template>
  <div v-if="items.length === 0" class="text-muted-foreground">-</div>
  <div v-else class="flex flex-wrap items-center gap-1">
    <NTag
      v-for="(item, idx) in visibleItems"
      :key="idx"
      size="small"
      :bordered="false"
      type="default"
      class="!text-xs"
    >
      {{ item.label }}
    </NTag>
    <NPopover v-if="hasRest" trigger="click" placement="bottom" :show-arrow="true">
      <template #trigger>
        <span class="cursor-pointer text-muted-foreground hover:text-primary">...</span>
      </template>
      <div class="flex max-w-xs flex-wrap gap-1">
        <NTag
          v-for="(item, idx) in restItems"
          :key="idx"
          size="small"
          :bordered="false"
          type="default"
          class="!text-xs"
        >
          {{ item.label }}
        </NTag>
      </div>
    </NPopover>
  </div>
</template>
