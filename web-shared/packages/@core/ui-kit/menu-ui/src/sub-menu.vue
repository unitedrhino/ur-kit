<script setup lang="ts">
import type { MenuRecordRaw } from '@vben-core/typings';

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { MenuBadge, MenuItem, SubMenu as SubMenuComp } from './components';
// eslint-disable-next-line import/no-self-import
import SubMenu from './sub-menu.vue';

interface Props {
  /**
   * 菜单项
   */
  menu: MenuRecordRaw;
}

defineOptions({
  name: 'SubMenuUi',
});

const props = withDefaults(defineProps<Props>(), {});
const { t, te } = useI18n({ useScope: 'global' });

/** menuLabel 仅翻译系统键，保留个人或企业录入的菜单名称。 */
function menuLabel(name: string) {
  return te(name) ? t(name) : name;
}

/**
 * 判断是否有子节点，动态渲染 menu-item/sub-menu-item
 */
const hasChildren = computed(() => {
  const { menu } = props;
  return Reflect.has(menu, 'children') && !!menu.children && menu.children.length > 0;
});
</script>

<template>
  <MenuItem
    v-if="!hasChildren"
    :key="menu.path"
    :active-icon="menu.activeIcon"
    :badge="menu.badge"
    :badge-type="menu.badgeType"
    :badge-variants="menu.badgeVariants"
    :icon="menu.icon"
    :path="menu.path"
  >
    <template #title>
      <span>{{ menuLabel(menu.name) }}</span>
    </template>
  </MenuItem>
  <SubMenuComp v-else :key="`${menu.path}_sub`" :active-icon="menu.activeIcon" :icon="menu.icon" :path="menu.path">
    <template #content>
      <MenuBadge :badge="menu.badge" :badge-type="menu.badgeType" :badge-variants="menu.badgeVariants" class="end-6" />
    </template>
    <template #title>
      <span>{{ menuLabel(menu.name) }}</span>
    </template>
    <template v-for="childItem in menu.children || []" :key="childItem.path">
      <SubMenu :menu="childItem" />
    </template>
  </SubMenuComp>
</template>
