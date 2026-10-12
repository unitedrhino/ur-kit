<script lang="ts" setup>
import { computed } from 'vue';

import { VkMarkdown } from '@vunk/markdown';
import { VkTemplateEcharts } from '@vunk/markdown/components/template-echarts';
import { VkTemplateMermaid } from '@vunk/markdown/components/template-mermaid';
import { VkTemplatesDefault } from '@vunk/markdown/components/templates-default';

import '@vunk/markdown/index.css';

import AlertBanner from './AlertBanner.vue';
import ChartRenderer from './ChartRenderer.vue';
import JsonViewer from './JsonViewer.vue';
import MermaidRenderer from './MermaidRenderer.vue';
import MetricCard from './MetricCard.vue';
import StatusBadge from './StatusBadge.vue';
import StepsRenderer from './StepsRenderer.vue';
import TableRenderer from './TableRenderer.vue';

defineOptions({ name: 'DocumentRenderer' });

interface Props {
  documentMd: string;
  state: Record<string, any>;
  component?: string;
}

const props = withDefaults(defineProps<Props>(), {
  component: '',
});

// =========================================================
// Segment type definitions
// =========================================================

interface HtmlSegment {
  type: 'html';
  markdown: string;
}

interface ComponentSegment {
  type: 'component';
  name: string;
  props: Record<string, any>;
}

type Segment = HtmlSegment | ComponentSegment;

// =========================================================
// Component tag name to Vue component mapping
// =========================================================

const componentMap: Record<string, any> = {
  chart: ChartRenderer,
  metric: MetricCard,
  'table-cpt': TableRenderer,
  steps: StepsRenderer,
  status: StatusBadge,
  alert: AlertBanner,
  'mermaid-diagram': MermaidRenderer,
  'json-view': JsonViewer,
};

// =========================================================
// Utility: resolve {{var}} from state with dot-path support
// =========================================================

function getByPath(obj: Record<string, any>, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.trim().split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function resolveTemplateValue(template: string, state: Record<string, any>): any {
  const trimmed = template.trim();
  // Check if the entire value is a {{var}} expression
  const varMatch = trimmed.match(/^\{\{(.+)\}\}$/);
  if (varMatch) {
    // 正则含捕获组，命中时 [1] 必有值，此处守卫仅为类型收窄
    const varPath = varMatch[1];
    if (varPath === undefined) return template;
    const resolved = getByPath(state, varPath.trim());
    if (resolved !== undefined) return resolved;
    return template;
  }
  // Partial replacement: replace embedded {{var}} in a string value
  return trimmed.replace(/\{\{(.+?)\}\}/g, (_m, path) => {
    const resolved = getByPath(state, path.trim());
    if (resolved === undefined || resolved === null) return _m;
    return String(resolved);
  });
}

// =========================================================
// Attribute parser: "key1="val1" key2="val2""
// =========================================================

function parseAttributes(attrsStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Match key="val" or key='val'
  const regex = /([\w-]+)\s*=\s*"([^"]*)"|([\w-]+)\s*=\s*'([^']*)'/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrsStr)) !== null) {
    const key = match[1] || match[3];
    // 正则两个互斥分支保证 [2]/[4] 必有一个非空，末尾兜底 '' 仅为类型收窄，不改变正常路径
    const value = (match[2] || match[4] || '').replace(/&quot;/g, '"');
    if (key === undefined) continue; // 正则互斥分支保证 key 必有值，此处守卫仅为类型收窄
    attrs[key] = value;
  }
  return attrs;
}

// =========================================================
// JSON auto-parse: try to parse string values as JSON objects/arrays
// =========================================================

function tryParseJSON(val: string): any {
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // ignore parse error, return original string
    }
  }
  return val;
}

// =========================================================
// Component tag regex patterns (8 types)
// =========================================================

// Combined regex to match any of the 8 self-closing component tags
const COMPONENT_TAG_RE =
  /<(chart|metric|table-cpt|steps|status|alert|mermaid-diagram|json-view)\s+([^>]*?)\s*\/>/g;

// =========================================================
// Preprocess: convert echarts code blocks to container format
// @vunk/markdown uses :::echarts container syntax for ECharts
// =========================================================

function preprocessEcharts(md: string): string {
  return md.replace(/```echarts\n([\s\S]*?)```/g, (_fullMatch, code: string) => {
    return `:::echarts\n\`\`\`json\n${code.trim()}\n\`\`\`\n:::`;
  });
}

// =========================================================
// Resolve template variables in the entire document
// =========================================================

function resolveDocumentVars(md: string, state: Record<string, any>): string {
  return md.replace(/\{\{(.+?)\}\}/g, (_m, path) => {
    const val = getByPath(state, path.trim());
    if (val === undefined || val === null) return _m;
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  });
}

// =========================================================
// Parse document into render segments
// =========================================================

function parseSegments(md: string, state: Record<string, any>): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  COMPONENT_TAG_RE.lastIndex = 0;

  while ((match = COMPONENT_TAG_RE.exec(md)) !== null) {
    const tagName = match[1];
    const attrsStr = match[2];
    // 正则含捕获组，命中时捕获组必有值，此处守卫仅为类型收窄
    if (tagName === undefined || attrsStr === undefined) continue;
    const matchStart = match.index;

    // Text before this tag becomes an HTML segment (markdown)
    if (matchStart > lastIndex) {
      const textChunk = md.slice(lastIndex, matchStart);
      if (textChunk.trim()) {
        segments.push({
          type: 'html',
          markdown: textChunk,
        });
      }
    }

    // Parse tag attributes and resolve variables
    const rawAttrs = parseAttributes(attrsStr);
    const resolvedProps: Record<string, any> = {};

    for (const [key, val] of Object.entries(rawAttrs)) {
      const resolved = resolveTemplateValue(val, state);
      // 对 data/code 等属性尝试 JSON 解析（echarts/json-view 需要对象而非字符串）
      resolvedProps[key] = tryParseJSON(resolved);
    }

    segments.push({
      type: 'component',
      name: tagName,
      props: resolvedProps,
    });

    lastIndex = matchStart + match[0].length;
  }

  // Remaining text after last tag
  if (lastIndex < md.length) {
    const textChunk = md.slice(lastIndex);
    if (textChunk.trim()) {
      segments.push({
        type: 'html',
        markdown: textChunk,
      });
    }
  }

  // If no tags found, treat entire document as markdown
  if (segments.length === 0 && md.trim()) {
    segments.push({
      type: 'html',
      markdown: md,
    });
  }

  return segments;
}

// =========================================================
// Preprocess document: variable interpolation + echarts conversion
// =========================================================

const processedMd = computed(() => {
  let md = props.documentMd;
  md = resolveDocumentVars(md, props.state);
  md = preprocessEcharts(md);
  return md;
});

// =========================================================
// Build computed render segments
// =========================================================

const segments = computed<Segment[]>(() => {
  return parseSegments(processedMd.value, props.state);
});

// =========================================================
// Resolve component name (with optional prefix)
// =========================================================

function getComponent(tagName: string): any {
  const vueComp = componentMap[tagName];
  if (!vueComp) return null;
  return vueComp;
}
</script>

<template>
  <div class="document-renderer space-y-4">
    <template v-for="(segment, index) in segments" :key="index">
      <!-- Markdown content rendered by @vunk/markdown -->
      <div
        v-if="segment.type === 'html'"
        class="document-renderer__markdown prose prose-sm max-w-none text-foreground"
      >
        <VkMarkdown
          :source="(segment as HtmlSegment).markdown"
          :fences="['mermaid']"
          :containers="['echarts']"
        >
          <VkTemplatesDefault />
          <VkTemplateEcharts />
          <VkTemplateMermaid />
        </VkMarkdown>
      </div>

      <!-- Dynamic component -->
      <component
        v-else-if="segment.type === 'component'"
        :is="getComponent((segment as ComponentSegment).name)"
        v-bind="(segment as ComponentSegment).props"
      />
    </template>

    <!-- Empty state -->
    <div
      v-if="segments.length === 0"
      class="text-muted-foreground py-8 text-center text-sm"
    >
      No content to render
    </div>
  </div>
</template>

<style scoped>
.document-renderer {
  word-break: break-word;
}

/* Markdown content styles within VkMarkdown */
.document-renderer :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.document-renderer :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.document-renderer :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.35;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.document-renderer :deep(p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.65;
}

.document-renderer :deep(ul),
.document-renderer :deep(ol) {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.document-renderer :deep(li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.document-renderer :deep(pre) {
  background-color: hsl(var(--muted));
  color: hsl(var(--foreground));
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  font-size: 0.8125rem;
  line-height: 1.6;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.document-renderer :deep(pre code) {
  color: hsl(var(--foreground));
  background-color: transparent;
}

/* @vunk/markdown 语法高亮 token 在浅色代码块上可能仍是浅色，强制使用主题前景色 */
.document-renderer :deep(pre code span),
.document-renderer :deep(pre .hljs),
.document-renderer :deep(pre .hljs span) {
  color: hsl(var(--foreground)) !important;
  background-color: transparent !important;
}

.document-renderer :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.8125rem;
  color: hsl(var(--foreground));
}

.document-renderer :deep(:not(pre) > code) {
  background-color: hsl(var(--muted) / 0.5);
  color: hsl(var(--foreground));
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
}

.document-renderer :deep(blockquote) {
  border-left: 3px solid hsl(var(--border));
  padding-left: 1rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.document-renderer :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.document-renderer :deep(th),
.document-renderer :deep(td) {
  border: 1px solid hsl(var(--border));
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
}

.document-renderer :deep(th) {
  background-color: hsl(var(--muted) / 0.5);
  font-weight: 600;
}

.document-renderer :deep(hr) {
  border: none;
  border-top: 1px solid hsl(var(--border));
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.document-renderer :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
  text-underline-offset: 2px;
}

.document-renderer :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
