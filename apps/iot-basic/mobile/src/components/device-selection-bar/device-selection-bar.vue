<!-- 多选操作栏：移动按项目管理资格与实际设备身份核验，其他操作复用现有页面。 -->
<template>
  <view class="selection-header"><text>已选择 {{ items.length }} 台</text><view class="selection-done" @tap="emit('close')"><text>完成</text></view></view>
  <view v-if="items.length && !accessLoading && !canChange" class="selection-note"><text>{{ items.some(item => item.isShared) ? '收到的分享设备不可移动或再次分享' : '需要当前项目管理权限' }}</text></view>
  <view class="selection-bar">
    <button :class="{ 'selection-button--disabled': !canSingleChange }" :disabled="!canSingleChange" @tap="openAutomation"><app-icon name="tabler:bolt" :size="20" /><text>自动化</text></button>
    <button :class="{ 'selection-button--disabled': !canChange }" :disabled="!canChange" @tap="openMove"><app-icon name="tabler:arrow-down-left" :size="20" /><text>移动设备</text></button>
    <button :class="{ 'selection-button--disabled': !canSingleChange }" :disabled="!canSingleChange" @tap="openShare"><app-icon name="tabler:share" :size="20" /><text>分享</text></button>
    <button :disabled="!items.length" @tap="moreVisible = !moreVisible"><app-icon name="tabler:settings" :size="20" /><text>更多</text></button>
  </view>
  <view v-if="moreVisible" class="selection-more">
    <view :class="{ 'selection-disabled': !canSingleChange }" @tap="openRename"><text>重命名</text></view>
    <view :class="{ 'selection-disabled': items.length !== 1 }" :aria-disabled="items.length !== 1" @tap="openSettings"><text>设备设置</text></view>
  </view>
  <view v-if="moveVisible" class="selection-mask" @tap="closeMove">
    <view class="selection-sheet" @tap.stop="noop">
      <view class="selection-sheet__head"><text>移动到区域</text><text @tap="closeMove">取消</text></view>
      <text v-if="areaError" class="selection-message" @tap="loadAreas">{{ areaError }} · 点击重试</text>
      <text v-else-if="areaLoading" class="selection-message">加载区域中...</text>
      <scroll-view v-else class="selection-areas" scroll-y>
        <area-tree :areas="areas" :selected-id="targetAreaID" @select="selectArea($event.areaID)" />
        <text v-if="!areas.length" class="selection-message">暂无可选区域，请先创建区域</text>
      </scroll-view>
      <button class="selection-confirm" :disabled="!targetAreaID || moving || !canChange" @tap="confirmMove">{{ moving ? '移动中...' : '确认移动' }}</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import AppIcon from '../app-icon/app-icon.vue';
import AreaTree from '../area-tree/area-tree.vue';
import type { DeviceEntity } from '../../domain/entities/device.entity';
import type { AreaEntity } from '../../domain/entities/area.entity';
import { areaService } from '../../services/area.service';
import { moveDevicesToArea } from '../../services/device-move.service';
import { authProvider } from '../../providers/auth.provider';
import { currentFamilyProvider } from '../../providers/current-family.provider';

/** items 是当前勾选设备，projectID 为当前项目；组件不提供插槽。 */
const props = defineProps<{ items: DeviceEntity[]; projectID: string }>();
/** close 退出选择，moved 返回失败设备供页面保留并刷新。 */
const emit = defineEmits<{ (event: 'close'): void; (event: 'moved', failed: DeviceEntity[]): void }>();
const canManage = ref(false);
const accessLoading = ref(true);
const moveVisible = ref(false);
const moreVisible = ref(false);
const areas = ref<AreaEntity[]>([]);
const targetAreaID = ref('');
const areaLoading = ref(false);
const areaError = ref('');
const moving = ref(false);
let active = true;
let accessRevision = 0;
/** canChange 只允许当前项目的非分享设备参与管理操作。 */
const canChange = computed(() => canManage.value && !!props.projectID && props.items.length > 0 && props.items.every(item => item.projectID === props.projectID && item.isShared === false));
const canSingleChange = computed(() => canChange.value && props.items.length === 1);
/** refreshAccess 读取最新项目管理资格，不依赖列表显示状态推断权限。 */
async function refreshAccess(): Promise<void> {
  const revision = ++accessRevision;
  canManage.value = false;
  accessLoading.value = true;
  if (!props.projectID) { accessLoading.value = false; return; }
  try {
    const allowed = await areaService.canManage(props.projectID, authProvider.getState().user?.userID || '');
    if (active && revision === accessRevision) canManage.value = allowed;
  } catch { if (active && revision === accessRevision) canManage.value = false; }
  finally { if (active && revision === accessRevision) accessLoading.value = false; }
}
watch(() => props.projectID, () => { void refreshAccess(); }, { immediate: true });
onUnmounted(() => { active = false; accessRevision++; });
/** noop 阻止点击面板内部时关闭弹层。 */
function noop(): void {}
/** loadAreas 获取当前项目完整区域分页，不包含未分类虚拟区域。 */
async function loadAreas(): Promise<void> {
  const projectID = props.projectID;
  areaLoading.value = true; areaError.value = ''; areas.value = [];
  try {
    for (let page = 1; ; page++) {
      if (page > 200) throw new Error('区域数量过多，请缩小范围');
      const result = await areaService.getList(projectID, page, 100);
      if (!active || projectID !== props.projectID) return;
      areas.value.push(...result.list.filter(item => item.areaID !== '2'));
      if (page * 100 >= result.total) break;
      if (!result.list.length) throw new Error('区域列表未完整加载');
    }
  } catch (error) { if (active) areaError.value = (error as Error).message || '区域加载失败'; }
  finally { if (active) areaLoading.value = false; }
}
/** openMove 打开目标区域选择。 */
function openMove(): void { if (!canChange.value) return; moreVisible.value = false; targetAreaID.value = ''; moveVisible.value = true; void loadAreas(); }
/** closeMove 不在提交中关闭，避免误以为写入已取消。 */
function closeMove(): void { if (!moving.value) moveVisible.value = false; }
/** selectArea 设置已校验的目标区域。 */
function selectArea(areaID: string): void { if (!moving.value) targetAreaID.value = areaID; }
/** confirmMove 复核资格和项目后逐台移动，部分失败保留失败设备并说明。 */
async function confirmMove(): Promise<void> {
  if (moving.value || !canChange.value || !areas.value.some(area => area.areaID === targetAreaID.value)) return;
  const projectID = props.projectID;
  const userID = authProvider.getState().user?.userID || '';
  const items = [...props.items];
  const areaID = targetAreaID.value;
  moving.value = true;
  try {
    if (!await areaService.canManage(projectID, userID)) throw new Error('没有项目管理权限');
    const result = await moveDevicesToArea(items, projectID, areaID, () => active && currentFamilyProvider.getState().projectID === projectID && authProvider.getState().user?.userID === userID);
    if (!active) return;
    moveVisible.value = false;
    emit('moved', result.failed.map(item => item.device));
    if (result.failed.length) {
      const detail = result.failed.map(item => `${item.device.deviceAlias || item.device.deviceName}：${item.message}`).join('\n');
      uni.showModal({ title: `成功 ${result.moved.length} 台，失败 ${result.failed.length} 台`, content: detail, showCancel: false });
    } else uni.showToast({ title: `已移动 ${result.moved.length} 台`, icon: 'success' });
  } catch (error) { if (active) uni.showToast({ title: (error as Error).message || '移动失败', icon: 'none' }); }
  finally { if (active) moving.value = false; }
}
/** openAutomation 用所选设备作为待配置的自动化触发设备。 */
function openAutomation(): void {
  if (!canSingleChange.value) return;
  const item = props.items[0]; emit('close');
  uni.navigateTo({ url: `/packageScene/pages/create/index?type=auto&source=deviceSelection&productID=${encodeURIComponent(item.productID)}&deviceName=${encodeURIComponent(item.deviceName)}` });
}
/** openRename 仅对一台可管理设备打开现有重命名页。 */
function openRename(): void {
  if (!canSingleChange.value) return;
  const item = props.items[0]; emit('close');
  uni.navigateTo({ url: `/packageDevice/pages/edit-name/index?productID=${encodeURIComponent(item.productID)}&deviceName=${encodeURIComponent(item.deviceName)}&current=${encodeURIComponent(item.deviceAlias || item.deviceName)}` });
}
/** openShare 仅对一台当前项目非分享设备打开分享页。 */
function openShare(): void {
  if (!canSingleChange.value) return;
  const item = props.items[0]; emit('close');
  uni.navigateTo({ url: `/packageDevice/pages/share/index?productID=${encodeURIComponent(item.productID)}&deviceName=${encodeURIComponent(item.deviceName)}` });
}
/** openSettings 打开现有设置，权限和删除确认由设置页处理。 */
function openSettings(): void {
  if (props.items.length !== 1) return;
  const item = props.items[0]; emit('close');
  uni.navigateTo({ url: `/packageDevice/pages/settings/index?productID=${encodeURIComponent(item.productID)}&deviceName=${encodeURIComponent(item.deviceName)}` });
}
</script>
<style lang="scss" scoped>
.selection-header { position: fixed; top: 0; left: 0; right: 0; z-index: 60; padding: calc(12px + env(safe-area-inset-top)) 20px 12px; min-height: 56px; box-sizing: border-box; background: var(--card-bg); display: flex; align-items: center; justify-content: space-between; font-size: var(--font-label); font-weight: 600; }
.selection-done { padding: 8px; color: var(--color-primary); font-size: var(--font-body); }
.selection-note { position: fixed; left: 16px; right: 16px; bottom: calc(90px + env(safe-area-inset-bottom)); z-index: 60; padding: 10px; border-radius: var(--radius-sm); background: var(--card-bg); color: var(--text-secondary); font-size: var(--font-caption); text-align: center; }
.selection-bar { position: fixed; z-index: 60; left: 0; right: 0; bottom: 0; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); display: flex; gap: 8px; background: var(--card-bg); }
.selection-bar button { flex: 1; margin: 0; padding: 0 4px; min-height: 58px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; line-height: 1.3; border-radius: var(--radius-md); font-size: var(--font-caption); color: var(--color-primary); background: var(--color-bg-secondary); }
.selection-bar button.selection-button--disabled, .selection-bar button[disabled] { color: var(--text-placeholder); opacity: .55; }
.selection-bar button::after { border: 0; }
.selection-more { position: fixed; right: 16px; bottom: calc(90px + env(safe-area-inset-bottom)); z-index: 61; min-width: 150px; border-radius: var(--radius-md); background: var(--card-bg); box-shadow: 0 8px 24px var(--color-shadow); }
.selection-more view { padding: 16px; font-size: var(--font-body); }
.selection-disabled { opacity: .4; }
.selection-mask { position: fixed; inset: 0; z-index: 70; display: flex; align-items: flex-end; background: var(--color-mask); }
.selection-sheet { box-sizing: border-box; width: 100%; padding: 20px 20px calc(20px + env(safe-area-inset-bottom)); background: var(--card-bg); border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
.selection-sheet__head { display: flex; justify-content: space-between; font-size: var(--font-label); font-weight: 600; }
.selection-areas { max-height: 50vh; margin: 12px 0; }
.selection-area { min-height: 48px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); font-size: var(--font-body); }
.selection-message { display: block; padding: 18px 0; font-size: var(--font-body); color: var(--text-secondary); }
.selection-confirm { min-height: 44px; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-on-primary); font-size: var(--font-body); }
</style>
