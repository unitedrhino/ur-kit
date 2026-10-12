<script lang="ts" setup>
import type { MenuRecordRaw } from '@vben/types';

import type { MenuProps } from '../../../../../@core/ui-kit/menu-ui/src/types';

import { Menu } from '@vben-core/menu-ui';

interface Props extends MenuProps {
  menus?: MenuRecordRaw[];
}

const props = withDefaults(defineProps<Props>(), {
  accordion: true,
  menus: () => [],
});

const emit = defineEmits<{
  open: [string, string[]];
  select: [string, string?];
}>();

function handleMenuSelect(key: string) {
  emit('select', key, props.mode);
}

function handleMenuOpen(key: string, path: string[]) {
  emit('open', key, path);
}
</script>

<template>
  <Menu
    :accordion="accordion"
    :collapse="collapse"
    :collapse-show-title="collapseShowTitle"
    :default-active="defaultActive"
    :menus="menus"
    :mode="mode"
    :rounded="rounded"
    :theme="theme"
    @open="handleMenuOpen"
    @select="handleMenuSelect"
  >
    <template #top v-if="mode === 'vertical'">
      <slot name="top"></slot>
    </template>
  </Menu>
</template>
