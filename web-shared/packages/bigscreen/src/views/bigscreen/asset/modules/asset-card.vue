<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script lang="ts" setup>
import { $t as t } from '@vben/saas/locales';

import { computed, ref, watch } from 'vue';

import { NButton, NIcon, NTag } from 'naive-ui';

import type { AssetInfo } from '../index.api';
import { isImageFile } from '../data';

const props = defineProps<{
  asset: AssetInfo;
  /** 父组件传入的分组名称，用于卡片底部展示 */
  groupName?: string;
}>();

defineEmits<{
  'copy-link': [asset: AssetInfo];
  delete: [asset: AssetInfo];
  download: [asset: AssetInfo];
  edit: [asset: AssetInfo];
  preview: [asset: AssetInfo];
}>();

/** 资源类型中文映射 */
const typeLabelMap: Record<string, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get image() { return t('console.im.image'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get video() { return t('console.im.callTypeVideo'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get audio() { return t('platformManage.aiModel.modalityAudio'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get other() { return t('orgManage.opLog.actionOther'); },
};
const typeLabel = computed(() => typeLabelMap[props.asset.type || ''] || props.asset.type || '');

/** 从 tags 中提取文件后缀（上传时存入） */
const ext = computed(() => {
  const t = props.asset.tags || '';
  return t.split(',')[0] || '';
});

/** 类型标签颜色映射：image→info, video→success, audio→warning, other→default */
const typeTagColor = computed(() => {
  const map: Record<string, 'default' | 'error' | 'info' | 'success' | 'warning'> = {
    image: 'info',
    video: 'success',
    audio: 'warning',
    other: 'default',
  };
  return map[props.asset.type || ''] || 'default';
});

/** 判断是否为图片：优先用 tags 后缀，兼容旧数据从 name 解析 */
const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico']);
const isImage = computed(() => {
  if (ext.value) return imageExts.has(ext.value);
  return isImageFile(props.asset.name);
});
const imgError = ref(false);
watch(() => props.asset.url, () => { imgError.value = false; });
</script>

<template>
  <div class="asset-card group">
    <!-- 缩略图容器 -->
    <div class="asset-card__thumb">
      <img
        v-if="isImage && asset.url && !imgError"
        :src="asset.url"
        class="asset-card__img"
        loading="lazy"
        @error="imgError = true"
      />
      <span
        v-else
        class="icon-[mdi--file-outline] size-10 text-gray-400 dark:text-gray-500"
      />

      <!-- Hover 遮罩操作栏 -->
      <div class="asset-card__overlay">
        <NButton
          circle
          size="small"
          ghost
          @click.stop="$emit('preview', asset)"
        >
          <template #icon>
            <NIcon><span class="icon-[mdi--eye-outline]" /></NIcon>
          </template>
        </NButton>
        <NButton
          circle
          size="small"
          ghost
          @click.stop="$emit('download', asset)"
        >
          <template #icon>
            <NIcon><span class="icon-[mdi--download]" /></NIcon>
          </template>
        </NButton>
        <NButton
          circle
          size="small"
          ghost
          @click.stop="$emit('edit', asset)"
        >
          <template #icon>
            <NIcon><span class="icon-[mdi--pencil-outline]" /></NIcon>
          </template>
        </NButton>
        <NButton
          circle
          size="small"
          ghost
          @click.stop="$emit('delete', asset)"
        >
          <template #icon>
            <NIcon><span class="icon-[mdi--delete-outline]" /></NIcon>
          </template>
        </NButton>
        <NButton
          circle
          size="small"
          ghost
          @click.stop="$emit('copy-link', asset)"
        >
          <template #icon>
            <NIcon><span class="icon-[mdi--link-variant]" /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <!-- 文件名 + 类型/分组信息 -->
    <div class="asset-card__info">
      <div class="asset-card__name" :title="asset.name">
        {{ asset.name }}
      </div>
      <div class="asset-card__meta">
        <NTag :type="typeTagColor" size="small" round :bordered="true">
          {{ typeLabel }}
        </NTag>
        <NTag v-if="ext" type="default" size="small" round :bordered="true">
          {{ ext.toUpperCase() }}
        </NTag>
        <NTag type="primary" size="small" round :bordered="true">
          {{ groupName }}
        </NTag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asset-card {
  width: 180px;
  height: 230px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--bigscreen-radius);
  border: 1px solid var(--bigscreen-card-border);
  background: var(--bigscreen-panel-bg);
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.dark .asset-card {
  background: var(--bigscreen-panel-bg);
  border-color: var(--bigscreen-card-border);
}

.asset-card:hover {
  box-shadow: var(--bigscreen-card-hover-shadow);
}

.asset-card__thumb {
  position: relative;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bigscreen-cover-bg);
  flex-shrink: 0;
}

.dark .asset-card__thumb {
  background: var(--bigscreen-cover-bg);
}

.asset-card__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

.asset-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgb(0 0 0 / 0.55);
  opacity: 0;
  transition: opacity 0.2s;
}

.asset-card:hover .asset-card__overlay {
  opacity: 1;
}

.asset-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 12px;
  gap: 4px;
  overflow: hidden;
}

.asset-card__name {
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--n-text-color-3, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
}

.asset-card__ext {
  font-weight: 600;
  opacity: 0.7;
}

.asset-card__group {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-card__group::before {
  content: '·';
  margin-right: 8px;
  color: var(--n-text-color-3, #9ca3af);
}
</style>
