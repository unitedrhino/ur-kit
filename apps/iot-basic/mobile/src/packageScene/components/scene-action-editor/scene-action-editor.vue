<!-- 场景其他动作编辑：配置关联场景、告警或通知，确认前保留草稿。 -->
<template>
  <view class="extra-page">
    <view class="extra-header"><view @tap="emit('cancel')">‹</view><text>{{ title }}</text><view /></view>
    <template v-if="draft.type === 'scene' && draft.scene">
      <text class="extra-tip">选择当前项目中的场景。手动场景会被执行，自动化则按所选状态启用或停用。</text>
      <view class="extra-card">
        <view class="extra-row"><text>目标场景</text><picker mode="selector" :range="sceneLabels" :value="selectedIndex" @change="selectScene"><text class="extra-link">{{ selectedLabel }} ›</text></picker></view>
        <view v-if="loading" class="extra-hint">正在加载场景...</view>
        <view v-else-if="error" class="extra-hint" @tap="loadScenes">{{ error }}，点击重试</view>
        <view v-else-if="!scenes.length" class="extra-hint">暂无其他可选场景</view>
        <view v-if="draft.scene.sceneType === 'auto'" class="extra-row"><text>目标状态</text><view class="extra-choices"><view :class="choice(draft.scene.status === 1)" @tap="draft.scene.status = 1">启用</view><view :class="choice(draft.scene.status === 2)" @tap="draft.scene.status = 2">停用</view></view></view>
      </view>
    </template>
    <template v-else-if="draft.type === 'notify' && draft.notify">
      <text class="extra-tip">通知能否送达取决于组织的通知渠道和模板配置。</text>
      <view class="extra-card">
        <view class="extra-row"><text>通知方式</text><picker mode="selector" :range="notifyLabels" :value="notifyIndex" @change="changeNotify"><text class="extra-link">{{ notifyLabels[notifyIndex] }} ›</text></picker></view>
        <view v-if="draft.notify.userType !== 'account'" class="extra-hint">此通知使用其他接收方式，请在 Web 端编辑，避免覆盖原配置。</view>
        <view v-if="draft.notify.userType === 'account'" class="extra-row" @tap="recipientsVisible = true"><text>接收账号</text><text class="extra-link extra-recipient-summary">{{ accountsText || '选择项目成员' }} ›</text></view>
        <view class="extra-row"><text>通知内容</text><input class="extra-input" :value="bodyText" placeholder="请输入通知内容" @input="onBodyInput" /></view>
      </view>
    </template>
    <button class="extra-save" @tap="save">确定</button>
    <recipient-picker :visible="recipientsVisible" :accounts="draft.notify?.accounts || []" @close="recipientsVisible = false" @select="selectRecipients" />
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SceneAction, NotifyType } from '../../../domain/models/scene-action.model';
import type { SceneEntity } from '../../../domain/entities/scene.entity';
import { sceneService } from '../../../services/scene.service';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import RecipientPicker from '../recipient-picker/recipient-picker.vue';
/** modelValue 是待编辑动作，currentSceneId 用于排除自身；组件无插槽。 */
const props = defineProps<{ modelValue: SceneAction; currentSceneId: string }>();
/** save 仅在参数完整时提交，cancel 丢弃草稿。 */
const emit = defineEmits<{ (event: 'save', value: SceneAction): void; (event: 'cancel'): void }>();
const draft = ref<SceneAction>(JSON.parse(JSON.stringify(props.modelValue)));
const title = computed(() => draft.value.type === 'scene' ? '执行其他场景' : draft.value.type === 'alarm' ? '告警动作' : '发送通知');
const scenes = ref<SceneEntity[]>([]); const loading = ref(false); const error = ref(''); let revision = 0;
const notifyTypes: NotifyType[] = ['message', 'wxMini', 'sms', 'email']; const notifyLabels = ['站内信', '微信小程序', '短信', '邮件'];
const notifyIndex = computed(() => Math.max(0, notifyTypes.indexOf(draft.value.notify?.type || 'message')));
const sceneLabels = computed(() => scenes.value.map(s => `${s.name}（${s.type === 'auto' ? '自动化' : '手动控制'}）`));
const selectedIndex = computed(() => Math.max(0, scenes.value.findIndex(s => s.id === draft.value.scene?.sceneID)));
const selectedLabel = computed(() => scenes.value.find(s => s.id === draft.value.scene?.sceneID)?.name || draft.value.scene?.sceneName || '请选择');
const accountsText = computed(() => (draft.value.notify?.accounts || []).join('，'));
const bodyText = computed(() => draft.value.notify?.params?.body || '');
const recipientsVisible = ref(false); let pendingBody: string | undefined;
/** selectRecipients 保存多选结果，未确认时保留原账号。 */
function selectRecipients(accounts: string[]): void { if (draft.value.notify) draft.value.notify.accounts = accounts; recipientsVisible.value = false; }
function choice(active: boolean): string { return active ? 'extra-choice extra-choice--active' : 'extra-choice'; }
/** loadScenes 获取全部分页并排除当前场景，防止切换项目后的旧请求覆盖。 */
async function loadScenes(): Promise<void> {
  const request = ++revision; const project = currentFamilyProvider.getState(); loading.value = true; error.value = ''; scenes.value = [];
  try { const list: SceneEntity[] = []; for (let page = 1; ; page++) { if (page > 200) throw new Error('场景数量过多'); const result = await sceneService.getList(page, 100); if (request !== revision || currentFamilyProvider.getState().projectID !== project.projectID || currentFamilyProvider.getState().currentTenantCode !== project.currentTenantCode) return; list.push(...result.list); if (list.length >= result.total) break; if (!result.list.length) throw new Error('场景列表未完整加载'); } scenes.value = list.filter(s => s.id !== props.currentSceneId && (s.type === 'auto' || s.type === 'manual')); }
  catch (e) { if (request === revision) error.value = (e as Error).message || '场景加载失败'; }
  finally { if (request === revision) loading.value = false; }
}
function selectScene(event: any): void { const item = scenes.value[Number(event.detail.value)]; if (!item || !draft.value.scene) return; draft.value.scene = { sceneID: item.id, sceneName: item.name, sceneType: item.type as 'auto' | 'manual', status: item.type === 'auto' ? 1 : 0 }; }
function changeNotify(event: any): void { if (draft.value.notify) draft.value.notify.type = notifyTypes[Number(event.detail.value)] || 'message'; }
function onBodyInput(event: any): void { pendingBody = String(event.detail?.value ?? ''); }
/** save 不允许保存空目标或空通知接收账号。 */
function save(): void {
  if (draft.value.type === 'scene' && (!draft.value.scene?.sceneID || loading.value || !!error.value || !scenes.value.some(s => s.id === draft.value.scene?.sceneID))) { uni.showToast({ title: '请选择可访问的目标场景', icon: 'none' }); return; }
  if (draft.value.type === 'notify' && draft.value.notify) {
    if (draft.value.notify.userType !== 'account') { uni.showToast({ title: '请在 Web 端编辑此接收方式', icon: 'none' }); return; }
    if (pendingBody !== undefined) draft.value.notify.params = { ...draft.value.notify.params, body: pendingBody.trim() };
    if (!draft.value.notify.accounts?.length) { uni.showToast({ title: '请选择接收账号', icon: 'none' }); return; }
    if (!draft.value.notify.params?.body) { uni.showToast({ title: '请输入通知内容', icon: 'none' }); return; }
    draft.value.notify.userType = 'account';
  }
  emit('save', JSON.parse(JSON.stringify(draft.value)));
}
if (draft.value.type === 'scene') void loadScenes();
</script>
<style scoped lang="scss">
.extra-page { min-height: 100vh; padding: 12px 16px calc(24px + env(safe-area-inset-bottom)); box-sizing: border-box; color: var(--text-primary); }
.extra-header,.extra-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.extra-header { min-height: 48px; font-weight: 600; font-size: var(--font-label); }.extra-header view { min-width: 40px; font-size: 30px; }
.extra-tip,.extra-hint { display: block; margin: 16px 0; color: var(--text-secondary); font-size: var(--font-caption); line-height: 1.5; }.extra-card { padding: 4px 14px; border-radius: var(--radius-md); background: var(--card-bg); }.extra-row { min-height: 52px; font-size: var(--font-body); border-bottom: 1px solid var(--border-color); }.extra-row:last-child { border: 0; }.extra-link { color: var(--color-primary); }.extra-input { flex: 1; min-width: 0; text-align: right; }.extra-choices { display: flex; gap: 8px; }.extra-choice { padding: 8px 12px; border-radius: var(--radius-full); background: var(--color-bg-secondary); }.extra-choice--active { color: var(--color-primary); background: var(--color-primary-light); }.extra-save { margin-top: 24px; min-height: 48px; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-on-primary); font-size: var(--font-body); }
.extra-recipient-summary { flex: 1; min-width: 0; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
