<!-- 文件说明：mermaid 代码块渲染组件；mermaid 库懒加载，仅接受 SVG 渲染产物，失败或产物异常退回代码块。 -->
<script setup lang="ts">
import { ref, watch } from 'vue';

/** code 为围栏内的 mermaid 源码，不含围栏标记行。 */
const props = defineProps<{ code: string }>();

/** 渲染成功的 SVG 内容；失败态保留原始代码，正文不因图表能力缺失而丢失。 */
const svg = ref('');
const failed = ref(false);
/** 请求序号隔离快速切换文档时的迟到渲染结果。 */
let renderSeq = 0;

async function render() {
  const current = ++renderSeq;
  svg.value = '';
  failed.value = false;
  try {
    const mermaidModule = await import('mermaid');
    // securityLevel 用 strict：产出内联 SVG；sandbox 会把图表包进 data:-URL iframe，
    // 在禁 data: frame 的部署环境（CSP）整体不可见，曾导致图表区域静默空白。
    mermaidModule.default.initialize({ logLevel: 'error', securityLevel: 'strict', startOnLoad: false });
    const { svg: rendered } = await mermaidModule.default.render(`kb-mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, props.code);
    if (current !== renderSeq) return;
    // render 正常返回也不代表可展示：sandbox/异常路径会给出 iframe 或空产物，
    // 此时必须按失败处理退回代码块，绝不能用不可见产物替换原文。
    if (typeof rendered === 'string' && rendered.trimStart().startsWith('<svg')) svg.value = rendered;
    else failed.value = true;
  } catch {
    if (current === renderSeq) failed.value = true;
  }
}
watch(() => props.code, render, { immediate: true });
</script>
<template>
  <div v-if="!failed && svg" class="bg-card overflow-x-auto rounded-md border p-3 text-center" data-testid="kb-mermaid-figure" v-html="svg"></div>
  <pre v-else class="text-foreground/90 whitespace-pre-wrap break-words text-sm leading-6" data-testid="kb-mermaid-code">{{ code }}</pre>
</template>
