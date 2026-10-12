<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/**
 * SceneAiAssistant —— 右侧抽屉内的 AI 对话面板。
 *
 * 交互：
 *  - 输入框 + 回车 / 发送按钮
 *  - 消息列表（用户 / 助手气泡，助手消息流式追加）
 *  - 当助手返回 ScenePatch 后，底部出现「预览 + 应用 / 丢弃」
 *  - 应用时调用 applyScenePatch(ctx, patch)
 */
import { computed, nextTick, ref, watch } from 'vue';

import type { SceneDraftContext } from '../composables/useSceneDraft';
import { diffPatch, getSectionLabel, summarizePatch } from './applyPatch';
import type { PatchDiffItem } from './applyPatch';
import { useSceneAi } from './useSceneAi';

const props = defineProps<{
  ctx: SceneDraftContext;
  sceneType?: 'auto' | 'manual';
}>();

const emit = defineEmits<{
  (e: 'applied'): void;
  (e: 'close'): void;
}>();

const ai = useSceneAi();
const input = ref('');
const scrollRef = ref<HTMLDivElement | null>(null);

function scrollBottom() {
  nextTick(() => {
    const el = scrollRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

watch(
  () => ai.messages.value.map((m) => m.content).join('\0'),
  () => scrollBottom(),
);

async function onSend() {
  const text = input.value.trim();
  if (!text || ai.streaming.value) return;
  input.value = '';
  await ai.send(text, {
    draft: props.ctx.draft,
    sceneType: props.sceneType,
  });
  scrollBottom();
}

function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) return;
  e.preventDefault();
  onSend();
}

function onApply() {
  if (!ai.pendingPatch.value) return;
  ai.apply(props.ctx);
  emit('applied');
}

function onDiscard() {
  ai.clearPending();
}

function onUndo() {
  ai.undo(props.ctx);
}

async function onRetry() {
  await ai.retryLast(props.ctx, { sceneType: props.sceneType });
  scrollBottom();
}

function onReset() {
  ai.clearAll();
  input.value = '';
}

const TOOL_LABELS: Record<string, string> = localizedSceneState(() => ({
  listDevices: $t('scene.ui.checkDeviceList'),
  getThingModel: $t('scene.ui.inspectionModel'),
  listAreas: $t('scene.ui.checkAreaList'),
}));

function toolLabel(name: string): string {
  return TOOL_LABELS[name] || name;
}

/** 记录每条 tool chip 的展开状态，key = `${msgIdx}:${callIdx}` */
const expandedCalls = ref<Record<string, boolean>>({});
function toggleCall(msgIdx: number, callIdx: number) {
  const key = `${msgIdx}:${callIdx}`;
  expandedCalls.value[key] = !expandedCalls.value[key];
}
function isCallExpanded(msgIdx: number, callIdx: number): boolean {
  return !!expandedCalls.value[`${msgIdx}:${callIdx}`];
}
function prettyJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

/** 计算 diff 预览列表 */
const diffItems = computed<PatchDiffItem[]>(() => {
  const p = ai.pendingPatch.value;
  if (!p) return [];
  return diffPatch(p, props.ctx.draft);
});

/** 按 section 分组，保持顺序 */
const diffGrouped = computed<
  { section: PatchDiffItem['section']; items: PatchDiffItem[] }[]
>(() => {
  const order: PatchDiffItem['section'][] = [
    'name',
    'desc',
    'triggers',
    'conditions',
    'actions',
    'validRanges',
    'invalidRanges',
  ];
  const map = new Map<PatchDiffItem['section'], PatchDiffItem[]>();
  for (const it of diffItems.value) {
    if (!map.has(it.section)) map.set(it.section, []);
    map.get(it.section)!.push(it);
  }
  return order
    .filter((s) => map.has(s))
    .map((s) => ({ section: s, items: map.get(s)! }));
});

const KIND_CLASS: Record<PatchDiffItem['kind'], string> = {
  add: 'text-emerald-600 dark:text-emerald-400',
  update: 'text-sky-600 dark:text-sky-400',
  change: 'text-sky-600 dark:text-sky-400',
  remove: 'text-rose-600 dark:text-rose-400',
};
const KIND_LABEL: Record<PatchDiffItem['kind'], string> = localizedSceneState(() => ({
  add: $t('iotApp.project.add'),
  update: $t('iotApp.productPage.modify'),
  change: $t('iotApp.productPage.modify'),
  remove: $t('orgEnergy.ui.delete'),
}));
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- 头部 -->
    <div
      class="border-border flex h-12 shrink-0 items-center justify-between border-b px-4"
    >
      <div class="flex items-center gap-2">
        <span
          class="bg-primary/10 text-primary inline-flex size-7 items-center justify-center rounded-md"
        >
          <span class="icon-[mdi--robot-outline] size-4"></span>
        </span>
        <div class="leading-tight">
          <div class="text-sm font-semibold">{{ $t('scene.ui.aiSceneAssistant') }}</div>
          <div class="text-muted-foreground text-[11px]">
            {{ $t('scene.ui.useNaturalLanguageDescriptionAndIWillHelpYouGenerate') }}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="ai.canUndo.value"
          type="button"
          class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          :title="$t('scene.ui.undoTheLatestApplication')"
          :disabled="ai.streaming.value"
          @click="onUndo"
        >
          <span class="icon-[mdi--undo] size-3.5"></span>{{ $t('platformManage.mall.revoke') }}
        </button>
        <button
          v-if="ai.messages.value.length > 0"
          type="button"
          class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          :title="$t('scene.ui.regenerateTheLastOne')"
          :disabled="ai.streaming.value"
          @click="onRetry"
        >
          <span class="icon-[mdi--refresh] size-3.5"></span>{{ $t('console.token.regenerate') }}
        </button>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground text-xs"
          :disabled="ai.streaming.value"
          @click="onReset"
        >
          {{ $t('iotApp.ota.clear') }}
        </button>
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-7 items-center justify-center rounded-md"
          :title="$t('scene.ui.closePanel')"
          @click="emit('close')"
        >
          <span class="icon-[mdi--close] size-4"></span>
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div
      ref="scrollRef"
      class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
    >
      <div
        v-if="ai.messages.value.length === 0"
        class="text-muted-foreground space-y-2 text-[13px] leading-relaxed"
      >
        <div class="text-foreground text-sm font-medium">{{ $t('iotApp.deviceDetail.taskExampleLabel') }}</div>
        <button
          type="button"
          class="bg-muted/50 hover:bg-muted block w-full rounded-md border border-dashed p-2 text-left text-xs"
          @click="input = $t('scene.ui.turnOnTheLivingRoomLightsAt7Am')"
        >
          {{ $t('scene.ui.turnOnTheLivingRoomLightsAt7Am') }}
        </button>
        <button
          type="button"
          class="bg-muted/50 hover:bg-muted block w-full rounded-md border border-dashed p-2 text-left text-xs"
          @click="input = $t('scene.ui.text8Pmonweekdaysturnoffalllights')"
        >
          {{ $t('scene.ui.text8Pmonweekdaysturnoffalllights') }}
        </button>
        <button
          type="button"
          class="bg-muted/50 hover:bg-muted block w-full rounded-md border border-dashed p-2 text-left text-xs"
          @click="input = $t('scene.ui.whenTheTemperatureExceeds28DegreesTurnOnTheAirCondit')"
        >
          {{ $t('scene.ui.whenTheTemperatureExceeds28DegreesTurnOnTheAirCondit') }}
        </button>
      </div>

      <div
        v-for="(m, idx) in ai.messages.value"
        :key="idx"
        class="flex"
        :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap"
          :class="
            m.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          "
        >
          <!-- tool 调用进度（只在 assistant 消息出现） -->
          <div
            v-if="m.role === 'assistant' && m.toolCalls && m.toolCalls.length"
            class="mb-1.5 space-y-1"
          >
            <div class="flex flex-wrap gap-1">
              <button
                v-for="(c, ci) in m.toolCalls"
                :key="ci"
                type="button"
                class="border-border bg-background/60 hover:bg-accent inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition"
                :class="
                  c.status === 'running'
                    ? 'text-muted-foreground'
                    : c.status === 'error'
                      ? 'text-destructive'
                      : 'text-foreground'
                "
                @click="toggleCall(idx, ci)"
              >
                <span
                  v-if="c.status === 'running'"
                  class="icon-[mdi--loading] size-3 animate-spin"
                ></span>
                <span
                  v-else-if="c.status === 'error'"
                  class="icon-[mdi--alert-circle-outline] size-3"
                ></span>
                <span
                  v-else
                  class="icon-[mdi--check-circle-outline] size-3"
                ></span>
                <span>{{ toolLabel(c.name) }}</span>
                <span
                  class="size-3"
                  :class="
                    isCallExpanded(idx, ci)
                      ? 'icon-[mdi--chevron-up]'
                      : 'icon-[mdi--chevron-down]'
                  "
                ></span>
              </button>
            </div>
            <div
              v-for="(c, ci) in m.toolCalls"
              v-show="isCallExpanded(idx, ci)"
              :key="`expand-${ci}`"
              class="bg-background/80 border-border space-y-1 rounded-md border p-2 text-[11px]"
            >
              <div class="text-muted-foreground font-medium">
                {{ toolLabel(c.name) }} · {{ $t('scene.ui.request') }}
              </div>
              <pre
                class="text-foreground max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-tight"
              >{{ prettyJson(c.input ?? {}) }}</pre>
              <div
                v-if="c.status === 'done'"
                class="text-muted-foreground font-medium"
              >
                {{ $t('orgIotClient.deviceLogs.colResponse') }}
              </div>
              <pre
                v-if="c.status === 'done'"
                class="text-foreground max-h-60 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-tight"
              >{{ prettyJson(c.output ?? {}) }}</pre>
              <div v-if="c.status === 'running'" class="text-muted-foreground">
                {{ $t('scene.ui.executing') }}
              </div>
            </div>
          </div>
          <template v-if="m.content">{{ m.content }}</template>
          <span
            v-else-if="m.role === 'assistant' && ai.streaming.value"
            class="text-muted-foreground"
          >{{ $t('scene.ui.thinking') }}</span>
        </div>
      </div>

      <div
        v-if="ai.error.value"
        class="border-destructive/30 bg-destructive/5 space-y-1.5 rounded-md border px-3 py-2 text-xs"
      >
        <div class="text-destructive flex items-start gap-1.5 font-medium">
          <span
            class="icon-[mdi--alert-circle-outline] mt-0.5 size-4 shrink-0"
          ></span>
          <span class="flex-1">{{ ai.error.value.title }}</span>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground -m-1 p-1"
            :title="$t('orgIotClient.console.off')"
            @click="ai.clearError()"
          >
            <span class="icon-[mdi--close] size-3.5"></span>
          </button>
        </div>
        <details
          v-if="ai.error.value.detail"
          class="text-muted-foreground cursor-pointer"
        >
          <summary class="select-none text-[10px]">{{ $t('iotApp.deviceDetail.viewDetails') }}</summary>
          <pre
            class="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all text-[10px]"
          >{{ ai.error.value.detail }}</pre>
        </details>
        <div v-if="ai.error.value.retryable" class="flex gap-2">
          <button
            type="button"
            class="bg-destructive/10 text-destructive hover:bg-destructive/20 inline-flex h-6 items-center gap-1 rounded px-2 text-[11px]"
            :disabled="ai.streaming.value"
            @click="onRetry"
          >
            <span class="icon-[mdi--refresh] size-3"></span>{{ $t('orgEnergy.ui.retry') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Patch 预览区 -->
    <div
      v-if="ai.hasPending.value && ai.pendingPatch.value"
      class="border-border bg-muted/30 shrink-0 border-t px-4 py-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <div class="text-foreground text-xs font-semibold">
          <span class="icon-[mdi--auto-fix] size-3.5 align-text-bottom"></span>
          {{ $t('scene.ui.changePreview') }} ({{
            summarizePatch(ai.pendingPatch.value).mode === 'replace'
              ? $t('scene.ui.replacementMode')
              : $t('scene.ui.mergeMode')
          }})
        </div>
        <div class="text-muted-foreground text-[11px]">
          {{ $t('scene.ui.itemsCount', { count: diffItems.length }) }}
        </div>
      </div>
      <div
        v-if="diffItems.length === 0"
        class="text-muted-foreground mb-3 text-[11px] italic"
      >
        {{ $t('scene.ui.noSubstantialChangesDetected') }}
      </div>
      <div
        v-else
        class="mb-3 max-h-56 space-y-1.5 overflow-y-auto pr-1 text-[11px]"
      >
        <div v-for="g in diffGrouped" :key="g.section">
          <div class="text-muted-foreground mb-0.5 font-medium">
            {{ getSectionLabel(g.section) }}
          </div>
          <div class="space-y-1">
            <div
              v-for="(it, i) in g.items"
              :key="i"
              class="bg-background border-border rounded border px-2 py-1"
            >
              <div class="flex items-center gap-1">
                <span
                  class="inline-flex h-4 items-center rounded px-1 text-[10px] font-medium"
                  :class="KIND_CLASS[it.kind]"
                >
                  {{ KIND_LABEL[it.kind] }}
                </span>
                <span class="text-foreground flex-1 truncate">
                  {{ it.label }}
                </span>
              </div>
              <div
                v-if="it.kind === 'update' || it.kind === 'change'"
                class="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]"
              >
                <span class="line-through opacity-60">{{ it.before }}</span>
                <span class="icon-[mdi--arrow-right] size-3"></span>
                <span>{{ it.after }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs disabled:opacity-50"
          :disabled="diffItems.length === 0"
          @click="onApply"
        >
          <span class="icon-[mdi--check] size-3.5"></span>
          {{ $t('scene.ui.applyToForm') }}
        </button>
        <button
          type="button"
          class="border-border hover:bg-accent h-8 rounded-md border px-3 text-xs"
          @click="onDiscard"
        >
          {{ $t('scene.ui.discard') }}
        </button>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="border-border bg-background shrink-0 border-t p-3">
      <div
        class="border-border focus-within:border-primary flex items-end gap-2 rounded-md border p-2 transition"
      >
        <textarea
          v-model="input"
          rows="2"
          :placeholder="$t('scene.ui.describeTheAutomationYouWantEnterToSendShiftEnterToW')"
          class="placeholder:text-muted-foreground/60 min-h-[40px] flex-1 resize-none bg-transparent text-sm outline-none"
          :disabled="ai.streaming.value"
          @keydown.enter="onEnter"
        ></textarea>
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex size-8 shrink-0 items-center justify-center rounded-md disabled:opacity-50"
          :disabled="!input.trim() || ai.streaming.value"
          @click="onSend"
        >
          <span
            v-if="ai.streaming.value"
            class="icon-[mdi--loading] size-4 animate-spin"
          ></span>
          <span v-else class="icon-[mdi--send] size-4"></span>
        </button>
      </div>
    </div>
  </div>
</template>
