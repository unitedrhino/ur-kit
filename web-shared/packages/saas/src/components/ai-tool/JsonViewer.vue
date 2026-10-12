<script lang="ts" setup>
import { computed, ref } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

defineOptions({ name: 'JsonViewer' });

interface Props {
  data: any;
  maxHeight?: string;
  collapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: '320px',
  collapsed: false,
});

const isCollapsed = ref(props.collapsed);

const formattedJson = computed(() => {
  try {
    if (props.data === null || props.data === undefined) return 'null';
    return JSON.stringify(props.data, null, 2);
  } catch {
    return String(props.data);
  }
});

const lineCount = computed(() => {
  return formattedJson.value.split('\n').length;
});

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<template>
  <div class="json-viewer bg-card border-border rounded-lg border overflow-hidden">
    <!-- Header bar -->
    <div
      class="bg-muted/30 border-border flex items-center justify-between border-b px-3 py-2"
    >
      <div class="flex items-center gap-2">
        <VbenIcon icon="lucide:braces" class="text-muted-foreground size-4" />
        <span class="text-muted-foreground text-xs font-medium">JSON</span>
        <span class="text-muted-foreground/60 text-xs">{{ lineCount }} lines</span>
      </div>
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
        @click="toggleCollapse"
      >
        <VbenIcon
          :icon="isCollapsed ? 'lucide:chevron-down' : 'lucide:chevron-up'"
          class="size-4"
        />
      </button>
    </div>

    <!-- Content -->
    <div
      v-show="!isCollapsed"
      class="overflow-auto p-3"
      :style="{ maxHeight: props.maxHeight }"
    >
      <pre
        class="text-foreground text-xs leading-relaxed whitespace-pre-wrap break-all"
        style="font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;"
      >{{ formattedJson }}</pre>
    </div>
  </div>
</template>
