<script setup lang="ts">
import { Table as ResizableTable } from '@unitedrhino/saas-ui/ui/table';

/**
 * 文件说明：菜单页「本页教程」入口按钮与教程抽屉。
 * 放在页面工具栏（toolbar-tools）/ 详情页头部，点击右侧滑出教程抽屉，按序渲染：
 * 用途说明 → 操作要点 → 深度小节（sections：说明列表 / 字段对照表 / 可复制的代码案例）→
 * 关键接入参数（可复制）→ 下一步流程跳转 → 官网完整教程链接。
 * 内容数据来自应用通过 registerPageGuides 注册的页面教程；guideKey 无对应内容时不渲染按钮。
 */
import { computed, ref } from 'vue';

import { useRouter } from 'vue-router';

import { NButton, NDrawer, NDrawerContent } from 'naive-ui';

import { $t } from '../locales';
import type { GuideCodeBlock, GuideParam } from './types';

import { getPageGuide } from './page-guide-registry';

const props = defineProps<{
  /** 教程内容 key（应用注册的 pageGuides 键，如 product-list / device-list） */
  guideKey: string;
}>();

const router = useRouter();
const show = ref(false);
/** 复制反馈状态：参数行用参数 label，代码块用 `code:小节序号` 作为 key */
const copiedKey = ref('');

const guide = computed(() => getPageGuide(props.guideKey));

/** 复制任意文本并展示「已复制」反馈 */
async function copyText(key: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedKey.value = key;
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = '';
    }, 1200);
  } catch {
    // 剪贴板不可用时静默忽略
  }
}

/** 复制参数行（复用原有行为，key 即参数 label） */
function copyParam(param: GuideParam) {
  return copyText(param.label, param.value);
}

/** 复制代码块（key: `code:小节下标`） */
function copyCode(sectionIndex: number, code: GuideCodeBlock) {
  return copyText(`code:${sectionIndex}`, code.content);
}
</script>

<template>
  <template v-if="guide">
    <NButton type="default" ghost @click="show = true">
      <template #icon>
        <span class="icon-[carbon--book]"></span>
      </template>
      {{ $t('helpCenter.tutorial') }}
    </NButton>
    <NDrawer v-model:show="show" :width="620" placement="right">
      <NDrawerContent :title="$t('helpCenter.thisPageGuide', { title: guide.title })" closable>
        <div class="space-y-5">
          <!-- 用途说明 -->
          <p class="text-sm text-muted-foreground">{{ guide.summary }}</p>

          <!-- 操作要点 -->
          <div v-if="guide.points.length">
            <div class="mb-1.5 text-sm font-medium text-foreground">{{ $t('helpCenter.keyPoints') }}</div>
            <ul class="space-y-1.5 text-sm text-foreground/90">
              <li v-for="(point, index) in guide.points" :key="index" class="flex gap-2">
                <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50"></span>
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>

          <!-- 深度小节：说明 / 对照表 / 代码案例 -->
          <div v-for="(section, si) in guide.sections || []" :key="section.title" class="border-t border-border pt-4">
            <div class="mb-2 text-sm font-semibold text-foreground">{{ section.title }}</div>

            <ul v-if="section.points?.length" class="space-y-1.5 text-sm text-foreground/90">
              <li v-for="(point, index) in section.points" :key="index" class="flex gap-2">
                <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50"></span>
                <span>{{ point }}</span>
              </li>
            </ul>

            <!-- 字段/枚举对照表 -->
            <div v-if="section.table" class="mt-2 overflow-x-auto rounded-md border border-border">
              <ResizableTable class="w-full border-collapse text-xs">
                <thead>
                  <tr class="bg-muted/50 text-left">
                    <th v-for="h in section.table.headers" :key="h" class="border-b border-border px-2.5 py-1.5 font-medium text-muted-foreground">
                      {{ h }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in section.table.rows" :key="ri" class="odd:bg-muted/20">
                    <td v-for="(cell, ci) in row" :key="ci" class="border-b border-border/60 px-2.5 py-1.5 align-top text-foreground/90 last:border-b-0">
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </ResizableTable>
            </div>

            <!-- 代码案例（可复制） -->
            <div v-if="section.code" class="mt-3 overflow-hidden rounded-md border border-border">
              <div class="flex items-center justify-between bg-muted/60 px-3 py-1.5">
                <span class="font-mono text-xs text-muted-foreground">
                  {{ section.code.title || section.code.lang }}
                </span>
                <button
                  class="cursor-pointer text-xs text-primary hover:underline"
                  @click="copyCode(si, section.code!)"
                >
                  {{ copiedKey === `code:${si}` ? $t('helpCenter.copied') : $t('helpCenter.copy') }}
                </button>
              </div>
              <pre dir="ltr" class="max-h-80 overflow-auto bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-100">{{ section.code.content }}</pre>
            </div>
          </div>

          <!-- 关键参数（可复制） -->
          <div v-if="guide.params?.length">
            <div class="mb-1.5 text-sm font-medium text-foreground">{{ $t('helpCenter.keyParameters') }}</div>
            <div class="overflow-hidden rounded-md border border-border">
              <div
                v-for="param in guide.params"
                :key="param.label"
                class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2 last:border-b-0 odd:bg-muted/30"
              >
                <span class="w-28 shrink-0 text-xs font-medium text-muted-foreground">{{ param.label }}</span>
                <code class="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{{ param.value }}</code>
                <button
                  class="shrink-0 cursor-pointer text-xs text-primary hover:underline"
                  @click="copyParam(param)"
                >
                  {{ copiedKey === param.label ? $t('helpCenter.copied') : $t('helpCenter.copy') }}
                </button>
              </div>
            </div>
          </div>

          <!-- 下一步流程打通 -->
          <div v-if="guide.next">
            <button
              class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
              @click="show = false; router.push(guide.next!.route)"
            >
              {{ guide.next.label }}
              <span class="icon-[carbon--arrow-right] size-3.5"></span>
            </button>
          </div>

          <!-- 完整教程外链 -->
          <a
            v-if="guide.docUrl"
            :href="guide.docUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {{ $t('helpCenter.viewFullGuide') }}
            <span class="icon-[carbon--launch] size-3.5"></span>
          </a>
        </div>
      </NDrawerContent>
    </NDrawer>
  </template>
</template>
