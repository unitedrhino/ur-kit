<script setup lang="ts">
/** 文件说明：单月日期选择控件，支持中文星期、键盘移动、不可选日期和受控值。 */
import type { CalendarRootProps } from 'reka-ui';
import {
  CalendarRoot,
  CalendarHeader,
  CalendarHeading,
  CalendarPrev,
  CalendarNext,
  CalendarGrid,
  CalendarGridHead,
  CalendarGridBody,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarCell,
  CalendarCellTrigger,
} from 'reka-ui';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { Button } from '../button';
/** 沿用 Reka 的 DateValue 输入，业务无需另建日期运算实现。 */
defineProps<CalendarRootProps>();
/** 单选日期变化；清除值由 undefined 表示。 */
defineEmits<{ 'update:modelValue': [value: CalendarRootProps['modelValue']] }>();
</script>
<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    v-bind="$props"
    locale="zh-CN"
    :week-starts-on="1"
    @update:model-value="$emit('update:modelValue', $event)"
    class="p-3"
  >
    <CalendarHeader class="mb-3 flex items-center justify-between"
      ><CalendarPrev as-child
        ><Button variant="outline" size="icon" class="size-8" aria-label="上个月"><ChevronLeft class="size-4" /></Button></CalendarPrev
      ><CalendarHeading class="text-sm font-medium" /><CalendarNext as-child
        ><Button variant="outline" size="icon" class="size-8" aria-label="下个月"><ChevronRight class="size-4" /></Button></CalendarNext
    ></CalendarHeader>
    <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse"
      ><CalendarGridHead
        ><CalendarGridRow
          ><CalendarHeadCell v-for="day in weekDays" :key="day" class="text-muted-foreground w-9 pb-2 text-xs font-normal">{{
            day
          }}</CalendarHeadCell></CalendarGridRow
        ></CalendarGridHead
      ><CalendarGridBody
        ><CalendarGridRow v-for="(week, index) in month.rows" :key="index"
          ><CalendarCell v-for="day in week" :key="day.toString()" :date="day" class="p-0 text-center"
            ><CalendarCellTrigger
              :day="day"
              :month="month.value"
              class="hover:bg-accent focus-visible:ring-ring data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[outside-view]:text-muted-foreground flex size-9 items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-40" /></CalendarCell></CalendarGridRow></CalendarGridBody
    ></CalendarGrid>
  </CalendarRoot>
</template>
