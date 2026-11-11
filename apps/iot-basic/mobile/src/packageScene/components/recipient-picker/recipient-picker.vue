<!-- 场景通知接收人选择：从当前项目的负责人和成员中多选。 -->
<template>
  <view v-if="visible" class="recipient-mask" @tap="emit('close')">
    <view class="recipient-sheet" @tap.stop>
      <view class="recipient-header"><text>选择接收账号</text><text class="recipient-link" @tap="emit('close')">取消</text></view>
      <text class="recipient-tip">选择当前项目成员，可多选</text>
      <scroll-view scroll-y class="recipient-list">
        <view v-if="loading" class="recipient-tip">正在加载成员...</view>
        <view v-else-if="error" class="recipient-tip" @tap="load">{{ error }}，点击重试</view>
        <view v-else-if="!people.length" class="recipient-tip">暂无可选成员</view>
        <view v-for="person in people" :key="person.account" class="recipient-item" @tap="toggle(person.account)">
          <view class="recipient-avatar">{{ person.name.slice(0, 1) }}</view>
          <view class="recipient-info"><text>{{ person.name }}</text><text class="recipient-account">{{ person.account }}</text></view>
          <view :class="['recipient-check', { 'recipient-check--active': selected.includes(person.account) }]">{{ selected.includes(person.account) ? '✓' : '' }}</view>
        </view>
      </scroll-view>
      <button class="recipient-save" :disabled="loading || !!error" @tap="confirm">确定（{{ selected.length }}）</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import { authProvider } from '../../../providers/auth.provider';
import { request } from '../../../utils/request';
/** visible 控制弹窗，accounts 是尚未提交的历史选择；无插槽。 */
const props = defineProps<{ visible: boolean; accounts: string[] }>();
/** select 返回所选账号，close 取消本次选择。 */
const emit = defineEmits<{ (e: 'select', accounts: string[]): void; (e: 'close'): void }>();
type Recipient = { account: string; name: string };
let loadedProject = ''; let loadedTenant = '';
const people = ref<Recipient[]>([]); const selected = ref<string[]>([]); const loading = ref(false); const error = ref(''); let revision = 0;
/** load 分页读取项目成员和负责人，项目切换或旧请求不能覆盖当前列表。 */
async function load(): Promise<void> {
  const id = ++revision; const project = currentFamilyProvider.getState(); loading.value = true; error.value = ''; people.value = [];
  try {
    if (!project.projectID) throw new Error('请先选择项目');
    const found = new Map<string, Recipient>();
    const add = (user: any, remark = '') => { const account = String(user?.userName || '').trim(); if (account) found.set(account, { account, name: String(remark || user?.nickName || account) }); };
    add(authProvider.getState().user);
    const info = await request<any>({ url: '/api/v1/things/project/info/get-one', data: { projectID: project.projectID, withAdminUser: true } }); add(info.adminUser);
    for (let page = 1; ; page++) {
      if (page > 200) throw new Error('成员数量过多');
      const result = await request<any>({ url: '/api/v1/things/data/project/get-list', data: { projectID: project.projectID, targetType: 'user', page: { page, size: 100 } } });
      const list = result.list || []; for (const member of list) if (String(member.projectID) === project.projectID) add(member.user, member.memberRemark);
      if (page * 100 >= Number(result.total || 0)) break;
      if (!list.length) throw new Error('成员列表未完整加载');
    }
    if (id !== revision || currentFamilyProvider.getState().projectID !== project.projectID || currentFamilyProvider.getState().currentTenantCode !== project.currentTenantCode) return;
    for (const account of props.accounts) if (!found.has(account)) found.set(account, { account, name: account });
    people.value = [...found.values()]; loadedProject = project.projectID; loadedTenant = project.currentTenantCode;
  } catch (e) { if (id === revision) error.value = (e as Error).message || '成员加载失败'; }
  finally { if (id === revision) loading.value = false; }
}
/** toggle 只更新弹窗草稿；取消时不影响原通知。 */
function toggle(account: string): void { selected.value = selected.value.includes(account) ? selected.value.filter(item => item !== account) : [...selected.value, account]; }
function confirm(): void { const project = currentFamilyProvider.getState(); if (project.projectID !== loadedProject || project.currentTenantCode !== loadedTenant) { error.value = '项目已切换，请重试'; return; } emit('select', [...selected.value]); }
watch(() => props.visible, value => { if (value) { selected.value = [...props.accounts]; void load(); } else revision++; });
</script>
<style scoped lang="scss">
.recipient-mask { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-end; background: var(--color-mask); }
.recipient-sheet { width: 100%; box-sizing: border-box; padding: 20px 16px calc(20px + env(safe-area-inset-bottom)); border-radius: var(--radius-lg) var(--radius-lg) 0 0; background: var(--card-bg); }
.recipient-header { display: flex; justify-content: space-between; font-size: var(--font-label); font-weight: 600; }.recipient-link { color: var(--color-primary); }
.recipient-tip { display: block; margin-top: 8px; font-size: var(--font-caption); color: var(--text-secondary); }.recipient-list { max-height: 50vh; margin-top: 12px; }
.recipient-item { display: flex; align-items: center; gap: 12px; min-height: 64px; border-bottom: 1px solid var(--border-color); }
.recipient-avatar { width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; flex-shrink: 0; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); }
.recipient-info { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: var(--font-body); gap: 4px; }.recipient-account { color: var(--text-secondary); font-size: var(--font-caption); }
.recipient-check { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); border-radius: 50%; }.recipient-check--active { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary); }
.recipient-save { margin-top: 20px; min-height: 48px; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-on-primary); font-size: var(--font-body); }
</style>
