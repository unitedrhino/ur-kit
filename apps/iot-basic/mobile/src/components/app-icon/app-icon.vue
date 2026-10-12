<template>
  <!-- #ifdef APP-PLUS -->
  <text
    class="app-icon app-icon--text"
    :aria-label="ariaLabel || undefined"
    :style="textIconStyle"
  >{{ iconGlyph }}</text>
  <!-- #endif -->
  <!-- #ifndef APP-PLUS -->
  <view
    class="app-icon"
    :aria-label="ariaLabel || undefined"
    :style="iconStyle"
  />
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DEFAULT_ICON_NAME, getIconDataUri, normalizeIconName } from '../../config/icons';

interface Props {
  name?: string;
  size?: number | string;
  color?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: DEFAULT_ICON_NAME,
  size: 20,
  color: 'currentColor',
  ariaLabel: '',
});

const ICON_GLYPHS: Record<string, string> = {
  'tabler:alert-triangle': '!',
  'tabler:archive': '箱',
  'tabler:armchair': '椅',
  'tabler:arrow-down-left': '↙',
  'tabler:automation': 'A',
  'tabler:baby-carriage': '儿',
  'tabler:bath': '浴',
  'tabler:bed': '床',
  'tabler:bell': '铃',
  'tabler:bluetooth': 'B',
  'tabler:bolt': '⚡',
  'tabler:books': '书',
  'tabler:bowl-spoon': '餐',
  'tabler:briefcase': '包',
  'tabler:building-off': '楼',
  'tabler:camera': '扫',
  'tabler:car': '车',
  'tabler:car-garage': '车',
  'tabler:check': '✓',
  'tabler:chevron-down': '▼',
  'tabler:chevron-left': '‹',
  'tabler:chevron-right': '›',
  'tabler:circle-check': '✓',
  'tabler:circle-x': '×',
  'tabler:clock': '时',
  'tabler:cloud': '云',
  'tabler:copy': '复制',
  'tabler:database-off': '空',
  'tabler:device-gamepad-2': '玩',
  'tabler:device-mobile': '机',
  'tabler:devices': '▣',
  'tabler:devices-off': '空',
  'tabler:door': '门',
  'tabler:eye': '看',
  'tabler:eye-off': '隐',
  'tabler:home': '⌂',
  'tabler:home-bolt': '⌁',
  'tabler:hourglass': '沙',
  'tabler:inbox': '空',
  'tabler:layout-grid': '▦',
  'tabler:microphone': '麦',
  'tabler:phone': '☎',
  'tabler:plant': '植',
  'tabler:player-play': '▶',
  'tabler:plus': '+',
  'tabler:refresh': '↻',
  'tabler:search': '⌕',
  'tabler:send': '发',
  'tabler:settings': '⚙',
  'tabler:tools-kitchen-2': '厨',
  'tabler:user': '人',
  'tabler:wash-machine': '洗',
  'tabler:wifi': '网',
  'tabler:wifi-off': '断',
  'tabler:x': '×',
  'ur:toilet': '卫',
};

const iconSize = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size));
const iconPath = computed(() => getIconDataUri(normalizeIconName(props.name)));
const iconName = computed(() => normalizeIconName(props.name));
const iconGlyph = computed(() => ICON_GLYPHS[iconName.value] || '□');
const iconStyle = computed(() => {
  const size = iconSize.value;
  const path = iconPath.value;
  return [
    `width: ${size}`,
    `height: ${size}`,
    `background-color: ${props.color}`,
    `-webkit-mask-image: url("${path}")`,
    `mask-image: url("${path}")`,
    '-webkit-mask-size: contain',
    'mask-size: contain',
    '-webkit-mask-repeat: no-repeat',
    'mask-repeat: no-repeat',
    '-webkit-mask-position: center',
    'mask-position: center',
  ].join('; ');
});
const textIconStyle = computed(() => {
  const size = iconSize.value;
  return [
    `width: ${size}`,
    `height: ${size}`,
    'line-height: 1',
    `font-size: ${size}`,
    `color: ${props.color}`,
  ].join('; ');
});
</script>

<style lang="scss" scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  line-height: 1;
  vertical-align: middle;
  pointer-events: none;
}

.app-icon--text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 600;
}
</style>
