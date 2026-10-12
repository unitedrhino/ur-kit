<!-- 原文预览容器：可见时按文件类型加载，切换文档时丢弃过期结果。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { FileViewerOptions } from '@file-viewer/vue3';

import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

import { usePreferences } from '@vben/preferences';

import { FileQuestion } from 'lucide-vue-next';
import { NButton, NSpin } from 'naive-ui';

import { loadPreviewViewer, loadRendererByFormat, previewFormat, sniffPreviewFormat } from './preview-renderers';

/** url 为受控原文地址；path 补充原始格式；fill 让工作台预览填满父容器，旧调用仍保持 560px。 */
const props = withDefaults(defineProps<{ filename: string; fill?: boolean; path?: string; url: string }>(), { fill: false, path: '' });
/** 预览外壳跟随应用主题，原始 PDF 页面保留文档自身颜色。 */
const { isDark } = usePreferences();
/** 展示名称没有扩展名时使用原始路径，保持渲染器格式推断一致。 */
const resolvedFilename = computed(() => (previewFormat(props.filename) ? props.filename : props.path || props.filename));
/** 异步加载的预览组件，组件脚本及样式加载失败也可重试。 */
const viewer = shallowRef<Awaited<ReturnType<typeof loadPreviewViewer>>>();
/** 当前成功装配的预览配置，切换文件时先清空旧实例。 */
const options = shallowRef<FileViewerOptions>();
/** 嗅探兜底判定出的展示文件名；扩展名命中时与 resolvedFilename 一致。 */
const renderFilename = ref('');
/** fetchHeadBytes 取原文地址头部字节供嗅探；Range 不被支持时退化为全量再截断。 */
async function fetchHeadBytes(): Promise<Uint8Array> {
  const response = await fetch(props.url, { headers: { Range: 'bytes=0-16383' } });
  if (!response.ok) throw new Error(`预览内容读取失败（${response.status}）`);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer.slice(0, 16_384));
}
/** 合并主题而不重新下载文件或装配渲染器。 */
const themedOptions = computed(() =>
  options.value
    ? {
        ...options.value,
        theme: isDark.value ? ('dark' as const) : ('light' as const),
        ...(props.fill ? { locale: 'zh-CN' as const, ui: { density: 'compact' as const }, toolbar: { download: false, theme: false } } : {}),
      }
    : undefined,
);
/** 加载状态与可重试错误，不暴露底层模块路径给用户。 */
const loading = ref(false);
const error = ref('');
/** 嗅探后仍无法识别的文件名；非空时呈现显式降级态（说明原因并提供下载入口）。 */
const unsupported = ref('');
/** 请求序号隔离快速切换文件与卸载后的异步结果。 */
let generation = 0;

/** 装配当前文件所需的唯一渲染器；扩展名未命中时按内容嗅探兜底，失败后可由按钮重新调用。 */
async function load() {
  const current = ++generation;
  options.value = undefined;
  error.value = '';
  unsupported.value = '';
  loading.value = true;
  try {
    let filename = resolvedFilename.value;
    let format = previewFormat(filename);
    if (!format) {
      const sniffed = sniffPreviewFormat(await fetchHeadBytes());
      if (!sniffed) {
        unsupported.value = resolvedFilename.value;
        return;
      }
      format = sniffed;
      filename = `preview.${sniffed === 'image' ? 'png' : sniffed}`;
    }
    const [component, renderer] = await Promise.all([loadPreviewViewer(), loadRendererByFormat(format)]);
    if (current !== generation) return;
    viewer.value = component;
    renderFilename.value = filename;
    options.value = {
      renderers: [renderer] as unknown as FileViewerOptions['renderers'],
      rendererMode: 'replace',
    };
  } catch {
    if (current === generation) error.value = $t('knowledgeBase.text_b3b0ba5b3fd6');
  } finally {
    if (current === generation) loading.value = false;
  }
}
watch(() => [props.url, props.filename, props.path], load, { immediate: true });
onBeforeUnmount(() => {
  generation++;
});
</script>

<template>
  <div class="relative min-h-0 w-full overflow-hidden" :class="fill ? 'h-full' : 'h-[560px]'" data-testid="source-preview">
    <NSpin v-if="loading" :description="$t('knowledgeBase.text_cc23756a10ea')" />
    <div v-else-if="unsupported" class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center" data-testid="source-preview-unsupported">
      <FileQuestion class="text-muted-foreground size-8" />
      <div class="text-foreground text-sm font-medium">{{ $t('knowledgeBase.unsupportedPreviewTitle') }}</div>
      <p class="text-muted-foreground max-w-md text-xs leading-6">
        {{ $t('knowledgeBase.unsupportedPreviewHint', { name: unsupported }) }}
      </p>
      <div class="flex items-center gap-2">
        <a
          class="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-3 text-sm"
          :download="unsupported"
          :href="url"
          rel="noopener noreferrer"
          target="_blank"
          data-testid="source-preview-download"
        >
          {{ $t('knowledgeBase.text_49fff7ff2403') }}
        </a>
        <NButton size="small" quaternary @click="load">{{ $t('knowledgeBase.text_e2d53a6d3a6a') }}</NButton>
      </div>
    </div>
    <div v-else-if="error" role="alert">
      {{ error }} <NButton @click="load">{{ $t('knowledgeBase.text_e2d53a6d3a6a') }}</NButton>
    </div>
    <component
      :is="viewer"
      v-else-if="options && viewer"
      :key="url"
      :url="url"
      :filename="renderFilename || resolvedFilename"
      :options="themedOptions"
      style="display: block; width: 100%; height: 100%; min-height: 0"
    />
  </div>
</template>
