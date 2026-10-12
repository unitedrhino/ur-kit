<script setup lang="ts">
import { computed } from 'vue';
import { VbenAvatar } from '@vben/common-ui';
import { getAvatarUrl, getInitials, getAvatarColorValue } from '../utils/utils';

interface Props {
  /**
   * 头像 URL（相对路径或完整路径）
   */
  avatar?: string;
  /**
   * 用户名或名称，用于生成首字母和背景色
   */
  name?: string;
  /**
   * 用户名（备用，如果 name 不存在则使用 userName）
   */
  userName?: string;
  /**
   * 头像大小（像素）
   * @default 32
   */
  size?: number;
  /**
   * 自定义类名
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  avatar: undefined,
  name: undefined,
  userName: undefined,
  size: 32,
  class: '',
});

const displayName = computed(() => props.name || props.userName || '');
const initials = computed(() => getInitials(displayName.value));
const backgroundColor = computed(() => getAvatarColorValue(displayName.value));
const avatarUrl = computed(() => {
  if (!props.avatar) return '';
  let url = props.avatar.trim();
  // 兼容后端把 https:// 误存为 https// 的情况
  if (url.startsWith('https//')) {
    url = `https://${url.slice(7)}`;
  } else if (url.startsWith('http//')) {
    url = `http://${url.slice(6)}`;
  }
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return getAvatarUrl(url);
});
</script>

<template>
  <div class="flex items-center justify-center">
    <div
      v-if="!props.avatar"
      :style="{
        backgroundColor: backgroundColor,
        color: '#ffffff',
        width: `${props.size}px`,
        height: `${props.size}px`,
      }"
      :class="[
        'flex items-center justify-center text-sm font-medium',
        props.class || 'rounded-full',
      ]"
    >
      {{ initials }}
    </div>
    <VbenAvatar
      v-else
      :src="avatarUrl"
      :alt="initials"
      :class="['w-8 h-8', props.class]"
      :size="props.size"
    />
  </div>
</template>
