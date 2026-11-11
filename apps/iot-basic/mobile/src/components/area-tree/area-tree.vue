<!-- 区域树：展开父级并选择具体区域，供首页和设备移动共用。 -->
<template>
  <view class="area-tree">
    <view v-for="row in rows" :key="row.area.areaID" class="area-tree__row" :class="{ 'area-tree__row--selected': row.area.areaID === selectedId }" :style="{ paddingLeft: `${12 + Math.min(row.depth, 6) * 18}px` }" :data-area-id="row.area.areaID">
      <view class="area-tree__toggle" :aria-label="collapsed.includes(row.area.areaID) ? '展开下级区域' : '收起下级区域'" @tap.stop="toggle(row.area.areaID)">
        <text v-if="row.hasChildren">{{ collapsed.includes(row.area.areaID) ? '›' : '⌄' }}</text>
      </view>
      <view class="area-tree__content" @tap="emit('select', row.area)">
        <app-icon class="area-tree__icon" :name="normalizeAreaIcon(row.area.areaImg)" :size="16" />
        <text class="area-tree__name">{{ row.area.areaName }}</text>
        <text v-if="showCount" class="area-tree__count">{{ row.area.deviceCount }}</text>
        <text v-if="row.area.areaID === selectedId" class="area-tree__check">✓</text>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppIcon from '../app-icon/app-icon.vue';
import { normalizeAreaIcon } from '../../config/area-icons';
import type { AreaEntity } from '../../domain/entities/area.entity';
import { flattenAreaTree, getAreaPath } from '../../utils/area-tree';
/** areas 为当前项目完整区域，selectedId 为所选区域，showCount 控制设备数；无插槽。 */
const props = withDefaults(defineProps<{ areas: AreaEntity[]; selectedId?: string; showCount?: boolean }>(), { selectedId: '', showCount: false });
/** select 返回实际区域，展开和收起不会触发选择。 */
const emit = defineEmits<{ (event: 'select', area: AreaEntity): void }>();
const collapsed = ref<string[]>([]);
const rows = computed(() => flattenAreaTree(props.areas, collapsed.value));
/** 从其他入口切换区域时展开其祖先，确保当前选中项可见。 */
watch(() => props.selectedId, (id) => {
  const ancestors = new Set(getAreaPath(props.areas, id).slice(0, -1).map(area => area.areaID));
  collapsed.value = collapsed.value.filter(areaID => !ancestors.has(areaID));
});
/** toggle 仅切换当前节点的展开状态。 */
function toggle(id: string): void { collapsed.value = collapsed.value.includes(id) ? collapsed.value.filter(item => item !== id) : [...collapsed.value, id]; }
</script>
<style scoped lang="scss">
.area-tree__row { min-height: 46px; display: flex; align-items: center; box-sizing: border-box; border-bottom: 1px solid var(--border-color); color: var(--text-primary); font-size: var(--font-body); }
.area-tree__row--selected { color: var(--color-primary); background: var(--color-primary-light); }
.area-tree__toggle { flex-shrink: 0; width: 24px; height: 44px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 20px; }
.area-tree__content { min-width: 0; flex: 1; min-height: 46px; display: flex; align-items: center; gap: 8px; padding-right: 14px; }
.area-tree__icon { flex-shrink: 0; color: var(--text-secondary); }
.area-tree__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.area-tree__count { font-size: var(--font-caption); color: var(--text-secondary); }.area-tree__check { color: var(--color-primary); }
</style>
