<!-- 区域管理：在一棵树中管理全部层级，并按需查看区域设备。 -->
<template>
<app-navigation-bar :title="`${projectName} - ${TERM.areaManageTitle}`" />
<scroll-view class="rm-page" scroll-y refresher-enabled @refresherrefresh="onPullDownRefresh">
  <view class="rm-search"><input class="rm-search__input" :value="searchValue" placeholder="搜索区域名称" confirm-type="search" @input="onSearchInput" /></view>
  <view class="rm-heading"><view><text class="rm-heading__title">全部区域</text><text class="rm-heading__hint">展开层级，直接管理各区域</text></view><view v-if="canManage" class="rm-create" role="button" aria-label="新建一级区域" @tap="handleCreate()"><app-icon name="tabler:plus" :size="16" /><text>新建一级</text></view></view>
  <view class="rm-tree">
    <loading v-if="areaTreeLoading && !treeAreas.length" text="区域加载中..." />
    <text v-else-if="areaTreeError" class="rm-message rm-message--error" @tap="loadAreaTree">{{ areaTreeError }} · 点击重试</text>
    <text v-else-if="!visibleRows.length" class="rm-message">{{ searchValue.trim() ? '没有匹配的区域' : '暂无区域' }}</text>
    <view v-for="row in areaTreeError ? [] : visibleRows" :key="row.area.areaID" class="rm-node" :data-area-id="row.area.areaID">
      <view class="rm-node__main" :style="{ paddingLeft: `${8 + Math.min(row.depth, 6) * 14}px` }">
        <view v-if="row.hasChildren" class="rm-node__toggle" role="button" :aria-label="collapsed.includes(row.area.areaID) && !searchValue.trim() ? '展开下级区域' : '收起下级区域'" @tap="toggleArea(row.area.areaID)"><text>{{ collapsed.includes(row.area.areaID) && !searchValue.trim() ? '›' : '⌄' }}</text></view><view v-else class="rm-node__toggle" />
        <app-icon class="rm-node__icon" :name="normalizeAreaIcon(row.area.areaImg)" :size="18" />
        <view class="rm-node__info"><text class="rm-node__name">{{ row.area.areaName }}</text><text class="rm-node__meta">子区域 {{ row.area.lowerLevelCount }}</text></view>
        <view class="rm-node__devices" role="button" @tap="toggleDevices(row.area)">查看设备</view>
      </view>
      <view v-if="canManage && row.area.isSysCreated !== 1 && row.area.areaID !== '2'" class="rm-node__actions" :style="{ paddingLeft: `${32 + Math.min(row.depth, 6) * 14}px` }">
        <view class="rm-node__action" role="button" :aria-label="`在${row.area.areaName}下新建区域`" @tap="handleCreate(row.area)"><app-icon name="tabler:plus" :size="15" /><text>新建下级</text></view>
        <view class="rm-node__action" role="button" :aria-label="`编辑${row.area.areaName}`" @tap="handleEdit(row.area)"><app-icon name="tabler:settings" :size="15" /><text>编辑</text></view>
        <view class="rm-node__action rm-node__action--danger" role="button" :aria-label="`删除${row.area.areaName}`" @tap="handleDelete(row.area)"><app-icon name="tabler:x" :size="15" /><text>删除</text></view>
      </view>
      <view v-if="deviceAreaID === row.area.areaID" class="rm-devices">
        <loading v-if="deviceLoading && !areaDevices.length" text="加载设备中..." />
        <text v-else-if="deviceError" class="rm-message rm-message--error" @tap="loadAreaDeviceList(true)">{{ deviceError }} · 点击重试</text>
        <view v-else-if="areaDevices.length" class="mobile-card-grid"><view v-for="item in areaDevices" :key="JSON.stringify([item.productID, item.deviceName])" class="mobile-card-cell"><device-card :deviceName="item.deviceName" :deviceAlias="item.deviceAlias" :productName="item.productName" :productID="item.productID" :deviceType="item.deviceType" :areaName="row.area.areaName" :deviceImg="item.deviceImg" :productImg="item.productImg" :status="item.status" :isShared="item.isShared" @select="handleDeviceTap" /></view></view>
        <text v-else class="rm-message">本区域暂无设备</text>
        <text v-if="deviceHasMore" class="rm-message rm-message--error" @tap="loadAreaDeviceList()">加载更多设备</text>
      </view>
    </view>
  </view>
  <view class="rm-bottom-spacer" />
</scroll-view>
<!-- 在当前页面完成新建或编辑，保留区域与设备上下文。 -->
<view v-if="editorVisible" class="rm-editor-mask" @tap="closeEditor">
  <view class="rm-editor" @tap.stop="noop">
    <view class="rm-editor__header"><text class="rm-editor__title">{{ editorID ? '编辑区域' : '新建区域' }}</text><view class="rm-editor__close" role="button" aria-label="关闭" @tap="closeEditor"><app-icon name="tabler:x" :size="20" /></view></view>
    <text class="rm-editor__hint">{{ editorID ? '修改区域名称和图标' : `添加到：${editorParentName || projectName}` }}</text>
    <text class="rm-editor__label">区域名称</text>
    <input class="rm-editor__input" :value="editorName" maxlength="30" placeholder="请输入区域名称" @input="onEditorNameInput" />
    <text class="rm-editor__label">区域图标</text>
    <scroll-view class="rm-editor__icons-scroll" scroll-y>
      <view class="rm-editor__icons"><view v-for="icon in areaIcons" :key="icon.value" class="rm-editor__icon" :class="{ 'rm-editor__icon--active': editorIcon === icon.value }" @tap="editorIcon = icon.value"><app-icon :name="icon.value" :size="22" /><text>{{ icon.label }}</text></view></view>
    </scroll-view>
    <view class="rm-editor__actions"><view class="rm-editor__cancel" @tap="closeEditor">取消</view><view class="rm-editor__save" :class="{ 'rm-editor__save--disabled': editorSaving || !editorCanSave }" @tap="saveEditor">{{ editorSaving ? '保存中...' : '保存' }}</view></view>
  </view>
</view>

</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import DeviceCard from '../../../components/device-card/device-card.vue';
import { areaService } from '../../../services/area.service';
import { deviceService } from '../../../services/device.service';
import { authProvider } from '../../../providers/auth.provider';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import { TERM } from '../../../config/terminology';
import { config } from '../../../config';
import { AREA_ICONS, AREA_ICON_DEFAULT, normalizeAreaIcon } from '../../../config/area-icons';
import { flattenAreaTree, getAreaPath } from '../../../utils/area-tree';
import type { AreaEntity } from '../../../domain/entities/area.entity';
import type { DeviceEntity } from '../../../domain/entities/device.entity';
import { ensurePageReady } from '../../../utils/page-guard';

/** 页面上下文和完整区域树；搜索保留匹配项的祖先。 */
const projectID = ref(''); const projectName = ref(''); const canManage = ref(false);
const treeAreas = ref<AreaEntity[]>([]); const areaTreeLoading = ref(false); const areaTreeError = ref('');
const searchValue = ref(''); const collapsed = ref<string[]>([]); let treeRevision = 0;
const visibleRows = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase();
  if (!keyword) return flattenAreaTree(treeAreas.value, collapsed.value);
  const included = new Set<string>();
  for (const area of treeAreas.value) if (area.areaName.toLowerCase().includes(keyword)) {
    for (const ancestor of getAreaPath(treeAreas.value, area.areaID)) included.add(ancestor.areaID);
  }
  return flattenAreaTree(treeAreas.value.filter(area => included.has(area.areaID)));
});
function onSearchInput(event: any) { searchValue.value = event.detail.value; }
function toggleArea(id: string) { if (searchValue.value.trim()) return; collapsed.value = collapsed.value.includes(id) ? collapsed.value.filter(item => item !== id) : [...collapsed.value, id]; }
/** 完整加载区域；失败不把不完整结果当作完整树。 */
async function loadAreaTree() {
  const revision = ++treeRevision; const pid = projectID.value;
  if (!pid) return;
  areaTreeLoading.value = true; areaTreeError.value = '';
  try {
    const list: AreaEntity[] = [];
    for (let page = 1; ; page++) {
      if (page > 200) throw new Error('区域数量过多，请联系管理员');
      const result = await areaService.getList(pid, page, 100);
      if (revision !== treeRevision || projectID.value !== pid) return;
      list.push(...result.list.filter(item => item.areaID !== '1' && item.areaID !== '2'));
      if (page * 100 >= result.total) break;
      if (!result.list.length) throw new Error('区域列表未完整加载');
    }
    treeAreas.value = list;
  } catch (err) { if (revision === treeRevision) areaTreeError.value = (err as Error).message || '区域加载失败'; }
  finally { if (revision === treeRevision) areaTreeLoading.value = false; }
}
/** 直接设备按区域单独分页，切换区域时忽略旧响应。 */
const deviceAreaID = ref(''); const areaDevices = ref<DeviceEntity[]>([]); const deviceLoading = ref(false);
const deviceError = ref(''); const deviceHasMore = ref(false); let devicePage = 0; let deviceRevision = 0;
function toggleDevices(area: AreaEntity) {
  deviceRevision++; deviceAreaID.value = deviceAreaID.value === area.areaID ? '' : area.areaID;
  areaDevices.value = []; deviceHasMore.value = false; deviceLoading.value = false; deviceError.value = '';
  if (deviceAreaID.value) void loadAreaDeviceList(true);
}
async function loadAreaDeviceList(reset = false) {
  const id = deviceAreaID.value; const pid = projectID.value;
  if (!id || !pid || (deviceLoading.value && !reset)) return;
  const revision = reset ? ++deviceRevision : deviceRevision; const page = reset ? 1 : devicePage + 1;
  deviceLoading.value = true; deviceError.value = '';
  try {
    const result = await deviceService.getList({ projectID: pid, areaID: id, page, size: 20 });
    if (revision !== deviceRevision || id !== deviceAreaID.value || pid !== projectID.value) return;
    const list = result.list.filter(item => item.projectID === pid && item.areaID === id);
    areaDevices.value = reset ? list : [...areaDevices.value, ...list]; devicePage = page;
    deviceHasMore.value = result.list.length > 0 && page * 20 < result.total;
  } catch (err) { if (revision === deviceRevision) deviceError.value = (err as Error).message || '设备加载失败'; }
  finally { if (revision === deviceRevision) deviceLoading.value = false; }
}
function handleDeviceTap(item: { productID: string; deviceName: string }) {
  if (!item.productID || !item.deviceName) return;
  if (currentFamilyProvider.getState().projectID !== projectID.value) currentFamilyProvider.switchFamily(projectID.value, projectName.value);
  uni.navigateTo({ url: `/packageDevice/pages/detail/index?productID=${encodeURIComponent(item.productID)}&deviceName=${encodeURIComponent(item.deviceName)}` });
}
/** 页面初次核验管理资格，显示树不依赖管理权限。 */
onLoad(async (options: Record<string, string | undefined> = {}) => {
  if (!await ensurePageReady('/packageUser/pages/room-manage/index', options)) return;
  projectID.value = options.projectID || ''; projectName.value = decodeURIComponent(options.projectName || '');
  try { canManage.value = await areaService.canManage(projectID.value, authProvider.getState().user?.userID || ''); }
  catch { canManage.value = false; uni.showToast({ title: '区域管理权限核验失败', icon: 'none' }); }
  await loadAreaTree();
});
onShow(() => { if (projectID.value) void loadAreaTree(); });
onUnload(() => { treeRevision++; deviceRevision++; });
function onPullDownRefresh() { Promise.all([loadAreaTree(), deviceAreaID.value ? loadAreaDeviceList(true) : Promise.resolve()]).finally(() => uni.stopPullDownRefresh()); }

/** 新建和编辑使用弹层草稿，保存时保持原区域树上下文。 */
const editorVisible = ref(false); const editorID = ref(''); const editorName = ref(''); let editorNameDraft = '';
const editorCanSave = ref(false); const editorIcon = ref<string>(AREA_ICON_DEFAULT); const editorSaving = ref(false);
const editorParentID = ref('1'); const editorParentName = ref(''); const areaIcons = AREA_ICONS;
function noop() {}
function onEditorNameInput(event: any) { editorNameDraft = event.detail.value; editorCanSave.value = !!editorNameDraft.trim(); }
function closeEditor() { if (!editorSaving.value) editorVisible.value = false; }
function handleCreate(parent?: AreaEntity) {
  if (!canManage.value || (parent && (parent.isSysCreated === 1 || parent.areaID === '2'))) return;
  editorParentID.value = parent?.areaID || '1'; editorParentName.value = parent?.areaName || '';
  editorID.value = ''; editorName.value = ''; editorNameDraft = ''; editorCanSave.value = false; editorIcon.value = AREA_ICON_DEFAULT; editorVisible.value = true;
}
function handleEdit(item: AreaEntity) {
  if (!canManage.value || item.isSysCreated === 1 || item.areaID === '2') return;
  editorID.value = item.areaID; editorName.value = item.areaName; editorNameDraft = item.areaName; editorCanSave.value = !!item.areaName.trim(); editorIcon.value = normalizeAreaIcon(item.areaImg); editorVisible.value = true;
}
async function saveEditor() {
  const name = editorNameDraft.trim(); if (!canManage.value || !name || editorSaving.value) return;
  editorSaving.value = true;
  try {
    if (editorID.value) await areaService.update({ areaID: editorID.value, areaName: name, areaImg: editorIcon.value });
    else { await areaService.create({ projectID: projectID.value, parentAreaID: editorParentID.value, areaName: name, areaImg: editorIcon.value }); const ancestors = new Set(getAreaPath(treeAreas.value, editorParentID.value).map(area => area.areaID)); collapsed.value = collapsed.value.filter(id => !ancestors.has(id)); searchValue.value = ''; }
    await loadAreaTree(); editorVisible.value = false; uni.showToast({ title: '已保存', icon: 'success' });
  } catch (err: unknown) { uni.showToast({ title: (err as Error).message || '保存失败', icon: 'none' }); }
  finally { editorSaving.value = false; }
}
async function handleDelete(item: AreaEntity) {
  if (!canManage.value || item.isSysCreated === 1 || item.areaID === '2') return;
  if (item.lowerLevelCount > 0) { await uni.showModal({ title: '暂时无法删除', content: `“${item.areaName}”还有下级区域，请先处理下级区域。`, showCancel: false, confirmText: '知道了' }); return; }
  if (item.deviceCount > 0) { await uni.showModal({ title: '暂时无法删除', content: `“${item.areaName}”还有设备，请先移动或移除设备。`, showCancel: false, confirmText: '知道了' }); return; }
  const { confirm } = await uni.showModal({ title: '删除区域', content: `确定删除“${item.areaName}”吗？删除后无法恢复。`, confirmText: '删除', cancelText: '取消', confirmColor: config.themeErrorColor });
  if (!confirm) return;
  try { await areaService.delete(item.areaID); if (deviceAreaID.value === item.areaID) { deviceRevision++; deviceAreaID.value = ''; } await loadAreaTree(); uni.showToast({ title: '已删除', icon: 'success' }); }
  catch (err: unknown) { uni.showToast({ title: (err as Error).message || '删除失败', icon: 'none' }); }
}
</script>
<style lang="scss" scoped>
.rm-page { flex: 1; min-height: 0; background: transparent; }
.rm-search { padding: 14px 16px 0; }.rm-search__input { box-sizing: border-box; padding: 0 14px; height: 44px; border-radius: var(--radius-md); background: var(--card-bg); color: var(--text-primary); font-size: var(--font-body); }
.rm-heading { margin: 18px 16px 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }.rm-heading__title { display: block; font-size: var(--font-section); font-weight: 700; color: var(--text-primary); }.rm-heading__hint { display: block; margin-top: 4px; color: var(--text-secondary); font-size: var(--font-caption); }
.rm-create { display: flex; align-items: center; gap: 4px; flex-shrink: 0; padding: 10px 12px; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-on-primary); font-size: var(--font-caption); }
.rm-tree { margin: 0 16px; padding: 4px 8px; border-radius: var(--radius-md); background: var(--card-bg); }.rm-node + .rm-node { border-top: 1px solid var(--border-color); }.rm-node__main { min-height: 50px; display: flex; align-items: center; gap: 7px; box-sizing: border-box; }.rm-node__toggle { width: 20px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 20px; }.rm-node__icon { flex-shrink: 0; color: var(--color-primary); }.rm-node__info { flex: 1; min-width: 0; padding: 8px 0; }.rm-node__name { display: block; color: var(--text-primary); font-size: var(--font-body); font-weight: 600; word-break: break-all; }.rm-node__meta { display: block; margin-top: 3px; color: var(--text-secondary); font-size: var(--font-caption); }.rm-node__devices { flex-shrink: 0; padding: 8px; color: var(--color-primary); font-size: var(--font-caption); }
.rm-node__actions { display: flex; gap: 18px; padding-top: 0; padding-bottom: 8px; flex-wrap: wrap; }.rm-node__action { display: flex; align-items: center; gap: 3px; min-height: 36px; padding: 0; color: var(--color-primary); font-size: var(--font-caption); }.rm-node__action--danger { color: var(--color-danger); }
.rm-devices { padding: 8px; border-radius: var(--radius-sm); background: var(--surface-muted); }.rm-message { display: block; padding: 16px 8px; color: var(--text-secondary); font-size: var(--font-body); }.rm-message--error { color: var(--color-primary); }.rm-bottom-spacer { height: calc(30px + env(safe-area-inset-bottom)); }
.rm-editor-mask { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; background: var(--color-mask); }
.rm-editor { width: 100%; max-width: 560px; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box; padding: 20px; border-radius: 24px; background: var(--card-bg); }
.rm-editor__header { display: flex; justify-content: space-between; align-items: center; }.rm-editor__title { color: var(--text-primary); font-size: var(--font-section); font-weight: 700; }.rm-editor__close { padding: 6px; color: var(--text-secondary); }
.rm-editor__hint { display: block; margin-top: 4px; color: var(--text-secondary); font-size: var(--font-caption); }.rm-editor__label { display: block; margin: 18px 0 8px; font-size: var(--font-body); font-weight: 600; color: var(--text-primary); }
.rm-editor__input { height: 44px; box-sizing: border-box; padding: 0 12px; border-radius: var(--radius-sm); background: var(--surface-muted); color: var(--text-primary); font-size: var(--font-body); }
.rm-editor__icons-scroll { max-height: 180px; }.rm-editor__icons { display: flex; flex-wrap: wrap; gap: 8px; }.rm-editor__icon { width: calc(25% - 6px); min-height: 68px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; border-radius: var(--radius-sm); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--font-caption); }.rm-editor__icon--active { background: var(--color-primary-light); color: var(--color-primary); }
.rm-editor__actions { display: flex; gap: 10px; margin-top: 20px; }.rm-editor__cancel, .rm-editor__save { flex: 1; display: flex; align-items: center; justify-content: center; height: 46px; border-radius: var(--radius-full); font-size: var(--font-body); font-weight: 600; }.rm-editor__cancel { background: var(--surface-muted); color: var(--text-primary); }.rm-editor__save { background: var(--color-primary); color: var(--color-on-primary); }.rm-editor__save--disabled { opacity: .45; }
</style>
