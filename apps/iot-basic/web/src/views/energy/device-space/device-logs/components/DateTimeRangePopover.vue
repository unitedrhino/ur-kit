<script setup lang="ts">
/**
 * 设备日志自定义时间范围选择器。
 *
 * 通过 shadcn Popover 承载起止时间输入，页面主工具栏只保留固定宽度触发按钮，避免筛选区在切换时发生布局抖动。
 */
import { $t } from '@vben/locales';

import { computed, ref } from 'vue';

import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger, Separator } from '@vben-core/shadcn-ui';

/** DateTimeRangePopoverProps 定义自定义时间选择器需要展示和编辑的时间范围。 */
const props = withDefaults(defineProps<{
  /** 结束时间的 datetime-local 字符串。 */
  endInput: string;
  /** 当前时间范围标签。 */
  label: string;
  /** 浮层是否打开，允许页面层在切换 Tab 时主动收起。 */
  open?: boolean;
  /** 开始时间的 datetime-local 字符串。 */
  startInput: string;
  /** 自定义时间入口按钮文案，避免和快捷时间按钮混淆。 */
  triggerLabel?: string;
}>(), {
  triggerLabel: $t('orgIotClient.deviceLogs.customTime'),
});

const emit = defineEmits<{
  /** 应用当前起止时间。 */
  apply: [];
  /** 更新结束时间输入值。 */
  'update:endInput': [value: string];
  /** 更新浮层开关状态。 */
  'update:open': [value: boolean];
  /** 更新开始时间输入值。 */
  'update:startInput': [value: string];
}>();

const innerOpen = ref(false);

const openModel = computed({
  get: () => props.open ?? innerOpen.value,
  set: (value: boolean) => {
    innerOpen.value = value;
    emit('update:open', value);
  },
});
const startModel = computed({
  get: () => props.startInput,
  set: (value: string) => emit('update:startInput', value),
});
const endModel = computed({
  get: () => props.endInput,
  set: (value: string) => emit('update:endInput', value),
});
const rangeSummary = computed(() => $t('orgIotClient.deviceLogs.timeRangeJoin', { start: props.startInput.replace('T', ' '), end: props.endInput.replace('T', ' ') }));

/** applyAndClose 提交时间范围并收起浮层，校验结果由页面层统一提示。 */
function applyAndClose() {
  emit('apply');
  openModel.value = false;
}
</script>

<template>
  <Popover v-model:open="openModel">
    <PopoverTrigger as-child>
      <Button data-testid="device-log-custom-time-trigger" variant="outline" size="sm" class="h-9 w-full justify-center md:w-[112px]">
        <span class="icon-[mdi--calendar-clock]" data-icon="inline-start"></span>
        {{ triggerLabel }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[min(calc(100vw-2rem),360px)] p-4" align="end">
      <div class="flex flex-col gap-4">
        <div>
          <div class="text-sm font-medium text-foreground">{{ $t('orgIotClient.deviceLogs.customTimeRange') }}</div>
          <div class="mt-1 text-xs text-muted-foreground">{{ $t('orgIotClient.deviceLogs.customRangeDesc') }}</div>
          <div class="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {{ label }}：{{ rangeSummary }}
          </div>
        </div>
        <Separator />
        <div class="grid gap-3">
          <div class="grid gap-2">
            <Label for="device-log-start-time">{{ $t('orgIotClient.deviceLogs.startTime') }}</Label>
            <Input id="device-log-start-time" v-model="startModel" class="h-9 tabular-nums" type="datetime-local" />
          </div>
          <div class="grid gap-2">
            <Label for="device-log-end-time">{{ $t('orgIotClient.deviceLogs.endTime') }}</Label>
            <Input id="device-log-end-time" v-model="endModel" class="h-9 tabular-nums" type="datetime-local" />
          </div>
        </div>
        <div class="flex justify-end">
          <Button size="sm" @click="applyAndClose">{{ $t('orgIotClient.deviceLogs.applyTime') }}</Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
