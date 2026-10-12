<script lang="ts" setup>
defineOptions({ name: 'AiToolDevWelcome' });

const emit = defineEmits<{
  useTemplate: [text: string];
}>();

const templates = [
  {
    icon: '📋',
    title: '查询设备在线状态',
    text: '帮我创建一个查询设备在线状态的工具，输入 deviceName，返回 online/offline。',
  },
  {
    icon: '🔧',
    title: '增加时间范围过滤',
    text: '在现有工具里增加一个按时间范围过滤的功能。',
  },
  {
    icon: '⚡',
    title: '优化执行效率',
    text: '优化这个工具的执行效率，减少不必要的 API 调用。',
  },
];

function onUseTemplate(text: string) {
  emit('useTemplate', text);
}
</script>

<template>
  <div class="rounded-lg border bg-muted/30 p-4 text-sm">
    <div class="mb-3 flex items-center gap-2 font-medium">
      <span class="text-lg">🛠️</span>
      <span>工具编辑助手</span>
    </div>
    <div class="mb-3 text-muted-foreground">
      我会按以下流程帮你开发工具：
    </div>
    <ol class="mb-4 ml-4 list-decimal space-y-1 text-muted-foreground">
      <li><strong>需求澄清</strong>：如果需求不够明确，我会先问你几个问题。</li>
      <li><strong>制定计划</strong>：我会输出任务计划，让你看到每一步要做什么。</li>
      <li><strong>逐步执行</strong>：按 plan 编写 executor.js、skill.md、manifest.json。</li>
      <li><strong>保存验证</strong>：完成后自动保存并刷新。</li>
    </ol>
    <div class="mb-2 text-muted-foreground">你可以直接描述需求，或点击下面的模板快速开始：</div>
    <div class="space-y-2">
      <button
        v-for="template in templates"
        :key="template.title"
        class="w-full rounded border bg-card p-3 text-left transition-colors hover:bg-muted/50"
        @click="onUseTemplate(template.text)"
      >
        <div class="mb-1 flex items-center gap-2 font-medium">
          <span>{{ template.icon }}</span>
          <span>{{ template.title }}</span>
        </div>
        <div class="text-muted-foreground text-xs">
          {{ template.text }}
        </div>
      </button>
    </div>
  </div>
</template>
