<script setup lang="ts">
/**
 * 文件说明：步骤向导外壳（StepShell）
 * 统一承载"左步骤条 + 右内容区"的两栏骨架，供规则/模板等编辑向导复用。
 * 步骤条渲染三态（当前/完成/错误/待访问），内容区与底部操作区由页面通过 slot 传入。
 * 页面自身仍负责 stepState / next / prev / 校验等业务逻辑，本组件只负责统一的视觉骨架。
 */
import type { StepShellState, StepShellStep } from './types';

import { Button } from '@unitedrhino/saas-ui/ui/button';

import { $t } from '@vben/locales';

defineOptions({ name: 'StepShell' });

const props = withDefaults(
  defineProps<{
    /** 内容区外层浅色背景（默认 bg-muted，灰底上浮现白色内容卡构成层次）。 */
    contentBgClass?: string;
    /** 加载态：内容卡不可交互并降低透明度。 */
    loading?: boolean;
    /** 允许访问的最大步骤序号（用于禁用未到达的步骤）。 */
    maxVisitedStep: number;
    /** 点击步骤条目时跳转到目标步骤。 */
    onStepClick?: (step: number) => void;
    /** 当前步骤序号（1 起）。 */
    step: number;
    /** 步骤标题与描述。 */
    steps: StepShellStep[];
    /** 返回某步骤的当前状态。 */
    stepState?: (step: number) => StepShellState;
  }>(),
  {
    stepState: undefined,
    onStepClick: undefined,
    contentBgClass: 'bg-muted',
    loading: false,
  },
);

/** 步骤序号圆点文本：完成显示 ✓，否则显示序号。 */
function stepNumber(idx: number): string {
  const state = props.stepState?.(idx + 1);
  return state === 'complete' ? '✓' : String(idx + 1);
}

/** 底部小状态文案：已完成 / 需要完善 / 空占位。 */
function stepStatusText(idx: number): string {
  const state = props.stepState?.(idx + 1);
  if (state === 'complete') return $t('iotApp.alarmCommon.stepDone');
  if (state === 'error') return $t('iotApp.alarmCommon.stepIssues');
  return '';
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-56px)] items-stretch" :class="[props.contentBgClass]">
    <!-- 左栏：步骤导航 -->
    <nav class="border-border bg-background w-56 shrink-0 border-r p-3">
      <div class="text-muted-foreground px-2 pb-2 text-[11px] uppercase tracking-wider">{{ $t('iotApp.alarmCommon.editStep') }}</div>
      <ul class="flex flex-col gap-1">
        <li v-for="(item, idx) in steps" :key="item.title">
          <Button
            type="button"
            variant="ghost"
            class="group relative flex h-auto w-full items-start gap-2.5 whitespace-normal rounded-md border border-transparent px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            :class="step === idx + 1 ? 'border-primary/30 bg-primary/5 rounded-lg' : 'hover:bg-accent'"
            :disabled="idx + 1 > maxVisitedStep"
            @click="onStepClick?.(idx + 1)"
          >
            <span
              class="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold"
              :class="{
                'bg-primary text-primary-foreground': step === idx + 1,
                'bg-destructive text-destructive-foreground': stepState?.(idx + 1) === 'error',
              }"
            >
              {{ stepNumber(idx) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-1.5">
                <span class="text-sm font-medium">{{ item.title }}</span>
                <span v-if="stepState?.(idx + 1) === 'error'" class="bg-destructive inline-flex size-1.5 rounded-full"></span>
              </span>
              <span class="text-muted-foreground mt-0.5 block text-[11px] leading-4">
                {{ item.description }}
              </span>
              <span class="mt-1 block h-3 text-[10px] leading-3" :class="stepState?.(idx + 1) === 'error' ? 'text-destructive' : 'text-primary'">
                <template v-if="stepStatusText(idx)">{{ stepStatusText(idx) }}</template>
                <span v-else aria-hidden="true">&nbsp;</span>
              </span>
            </span>
          </Button>
        </li>
      </ul>
    </nav>

    <!-- 右栏：当前步骤工作区 -->
    <main class="min-w-0 flex-1 p-4 md:p-6">
      <div class="bg-background w-full rounded-lg border p-6 shadow-sm" :class="loading ? 'pointer-events-none opacity-60' : ''">
        <slot></slot>
        <slot name="footer"></slot>
      </div>
    </main>
  </div>
</template>
