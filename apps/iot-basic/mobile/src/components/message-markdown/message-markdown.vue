<!-- 消息 Markdown 摘要：将站内消息中允许的基础 Markdown 安全地渲染为小程序/H5 原生节点。 -->
<template>
  <view class="message-markdown">
    <view v-for="(block, index) in blocks" :key="`${block.type}-${index}`" class="message-markdown__block">
      <text v-if="block.type === 'heading'" class="message-markdown__heading">{{ block.text }}</text>
      <text v-else-if="block.type === 'list'" class="message-markdown__list">• {{ block.text }}</text>
      <image v-else-if="block.type === 'image'" class="message-markdown__image" :src="block.src" mode="widthFix" @error="handleImageError(index)" />
      <text v-else class="message-markdown__text">{{ block.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

/** 消息正文，支持标题、列表、粗体、行内代码、链接和图片语法。 */
const props = defineProps<{ content?: string }>();
const failedImages = ref(new Set<number>());

type MessageBlock = { type: 'heading' | 'list' | 'image' | 'text'; text: string; src?: string };

/** 只保留无需 HTML 的基础 Markdown，避免消息正文注入任意标签或脚本。 */
const blocks = computed<MessageBlock[]>(() => {
  const content = String(props.content || '').replace(/\r\n?/g, '\n');
  return content.split('\n').map((line, lineIndex): MessageBlock | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const image = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/);
    if (image && !failedImages.value.has(lineIndex)) return { type: 'image', text: image[1], src: image[2] };
    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (heading) return { type: 'heading', text: normalizeInline(heading[1]) };
    const list = trimmed.match(/^[-*]\s+(.+)$/);
    if (list) return { type: 'list', text: normalizeInline(list[1]) };
    return { type: 'text', text: normalizeInline(trimmed) };
  }).filter((item): item is MessageBlock => item !== null);
});

function normalizeInline(value: string): string {
  return value.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)');
}

/** 图片加载失败后隐藏该图片，避免无效资源占据消息详情空间。 */
function handleImageError(index: number): void {
  failedImages.value = new Set([...failedImages.value, index]);
}
</script>

<style lang="scss" scoped>
.message-markdown{margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--color-surface-muted)}
.message-markdown__block{margin-top:6px}.message-markdown__block:first-child{margin-top:0}
.message-markdown__heading{display:block;font-size:var(--font-body);font-weight:700;color:var(--text-primary)}
.message-markdown__text,.message-markdown__list{display:block;font-size:var(--font-caption);line-height:1.65;color:var(--text-primary);word-break:break-word}
.message-markdown__list{padding-left:4px}.message-markdown__image{display:block;width:100%;max-height:220px;border-radius:8px;background:var(--color-surface)}
</style>
