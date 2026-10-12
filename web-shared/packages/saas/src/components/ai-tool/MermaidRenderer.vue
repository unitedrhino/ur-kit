<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ name: 'MermaidRenderer' });

interface Props {
  type: string;
  code: string;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLDivElement>();
const loading = ref(true);
const error = ref('');
const svgContent = ref('');

async function renderMermaid() {
  if (!props.code) {
    error.value = 'No diagram code provided';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';
  svgContent.value = '';

  try {
    const mermaid = await import('mermaid');

    const isDark = document.documentElement.classList.contains('dark');

    mermaid.default.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'sandbox',
      logLevel: 'error',
    });

    const { svg } = await mermaid.default.render(
      `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      props.code,
    );
    svgContent.value = svg;
  } catch (err: any) {
    error.value = err?.message ?? 'Failed to render diagram';
    console.error('[MermaidRenderer] Render error:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  nextTick(() => renderMermaid());
});

onBeforeUnmount(() => {
  svgContent.value = '';
});

watch(
  () => [props.type, props.code],
  () => {
    nextTick(() => renderMermaid());
  },
);
</script>

<template>
  <div class="mermaid-renderer bg-card border-border rounded-lg border overflow-hidden">
    <!-- Header -->
    <div class="bg-muted/30 border-border flex items-center gap-2 border-b px-3 py-2">
      <span class="text-muted-foreground text-xs font-medium uppercase">{{ props.type }}</span>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="text-muted-foreground flex items-center justify-center py-12 text-sm"
    >
      Rendering diagram...
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center gap-2 py-8"
    >
      <span class="text-destructive text-sm font-medium">Render Error</span>
      <pre class="text-muted-foreground max-w-full overflow-auto px-4 text-xs">{{ error }}</pre>
    </div>

    <!-- Rendered SVG -->
    <div
      v-else
      ref="containerRef"
      class="flex justify-center overflow-auto p-4"
      v-html="svgContent"
    />
  </div>
</template>

<style scoped>
.mermaid-renderer :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
