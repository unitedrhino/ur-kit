<template>
<view class="empty-state">
  <view class="empty-state__icon">
    <app-icon class="empty-state__glyph" :name="displayIcon" :size="56" />
  </view>
  <text class="empty-state__text">{{text}}</text>
  <view v-if="buttonText" class="empty-state__btn" @tap="handleAction" hover-class="empty-state__btn--hover">
    <text>{{buttonText}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppIcon from '../app-icon/app-icon.vue';
import { computed } from 'vue';
import { EMPTY_STATE_ICONS, normalizeIconName } from '../../config/icons';

interface Props {
  icon?: string;
  text?: string;
  buttonText?: string;
}
const emit = defineEmits<{ (e: 'action'): void }>();
const props = withDefaults(defineProps<Props>(), {
  icon: 'empty',
  text: '暂无数据',
  buttonText: '',
});

const emptyIconMap: Record<string, string> = {
  empty: EMPTY_STATE_ICONS.empty,
  'no-data': EMPTY_STATE_ICONS.noData,
  'no-device': EMPTY_STATE_ICONS.noDevice,
  'no-network': EMPTY_STATE_ICONS.noNetwork,
  'no-scene': EMPTY_STATE_ICONS.noScene,
};

const displayIcon = computed(() => normalizeIconName(emptyIconMap[props.icon] || props.icon, EMPTY_STATE_ICONS.empty));

function handleAction() {
  emit('action');
}
/* eslint-disable */
// Component({
//   properties: {
//     icon: { type: String, value: 'empty' }, // empty | no-network | no-device | no-scene
//     text: { type: String, value: '暂无数据' },
//     buttonText: { type: String, value: '' },
//   },
//   methods: {
//     handleAction() {
//       this.triggerEvent('action');
//     },
//   },
// });
// 
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
}

.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
  background-color: var(--color-bg-secondary);
  border-radius: 50%;
}

.empty-state__glyph {
  color: var(--text-placeholder);
}

.empty-state__text {
  font-size: 14px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state__btn {
  margin-top: 20px;
  padding: 8px 24px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 14px;
  border-radius: 20px;
}

.empty-state__btn--hover {
  opacity: 0.7;
}

</style>
