<!-- 项目邀请二维码弹窗：负责人选择现有权限后生成十分钟有效凭证。 -->
<template>
  <view class="invite-mask" @tap.stop>
    <view class="invite-dialog">
      <view class="invite-head"><text class="invite-title">邀请加入{{ projectName }}</text><text class="invite-close" @tap="emit('close')">×</text></view>
      <text class="invite-desc">选择成员权限，扫码后立即加入当前项目</text>
      <view class="invite-auth">
        <view v-for="item in authOptions" :key="item.value" :class="`invite-auth__item ${authType === item.value ? 'invite-auth__item--active' : ''}`" @tap="authType = item.value">
          <text class="invite-auth__title">{{ item.title }}</text><text class="invite-auth__desc">{{ item.desc }}</text>
        </view>
      </view>
      <scroll-view v-if="authType === 3" class="invite-areas" scroll-y>
        <text class="invite-area-title">只读区域（至少选择一个）</text>
        <view v-if="areasLoading" class="invite-area-state">正在加载区域…</view>
        <view v-else-if="areas.length === 0" class="invite-area-state">当前项目暂无可授权区域</view>
        <view v-else v-for="area in areas" :key="area.areaID" class="invite-area-row" @tap="toggleArea(area.areaID)">
          <view :class="`invite-check ${selectedAreas.has(area.areaID) ? 'invite-check--active' : ''}`">{{ selectedAreas.has(area.areaID) ? '✓' : '' }}</view>
          <text>{{ area.areaName }}</text>
          <text class="invite-area-children" @tap.stop="toggleChildren(area.areaID)">{{ childrenAreas.has(area.areaID) ? '含下级' : '本区域' }}</text>
        </view>
      </scroll-view>
      <view v-if="qrText" class="invite-qr"><canvas canvas-id="project-invite-qr" id="project-invite-qr" class="invite-qr__canvas" /></view>
      <text v-if="qrText" class="invite-expire">二维码有效期 10 分钟，可截图分享；关闭弹窗不会撤销</text>
      <text v-if="error" class="invite-error">{{ error }}</text>
      <view v-if="qrText" class="invite-actions"><view class="invite-btn invite-btn--danger" @tap="handleRevoke">撤销二维码</view><view class="invite-btn" @tap="emit('close')">关闭</view></view>
      <view v-else class="invite-btn" @tap="handleCreate">{{ creating ? '生成中…' : '生成二维码' }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { encode } from 'uqr';
import { areaService } from '../../../services/area.service';
import { createProjectInvite, encodeProjectInviteQr, revokeProjectInvite, type ProjectInviteArea } from '../../../services/project-invite.service';

const props = defineProps<{ projectID: string; projectName: string }>();
const emit = defineEmits<{ (event: 'close'): void; (event: 'created'): void }>();
const authType = ref(2);
const areas = ref<ProjectInviteArea[]>([]);
const selectedAreas = ref(new Set<string>());
const childrenAreas = ref(new Set<string>());
const areasLoading = ref(false);
const creating = ref(false);
const error = ref('');
const qrText = ref('');
const instance = getCurrentInstance();
let timer: ReturnType<typeof setTimeout> | null = null;

const authOptions = [
  { value: 1, title: '管理', desc: '可管理项目成员和权限' },
  { value: 2, title: '读写', desc: '可查看并操作项目设备' },
  { value: 3, title: '只读', desc: '仅查看选定区域设备' },
];

/** 读取当前项目全部顶层区域，选择结果只提交现有区域权限模型支持的字段。 */
async function loadAreas() {
  areasLoading.value = true;
  try {
    const result = await areaService.getList(props.projectID, 1, 200);
    areas.value = result.list.map((area) => ({ areaID: area.areaID, areaName: area.areaName, isAuthChildren: 2 }));
  } catch (err) {
    error.value = (err as Error).message || '区域加载失败';
  } finally {
    areasLoading.value = false;
  }
}
function toggleArea(areaID: string) {
  const next = new Set(selectedAreas.value);
  if (next.has(areaID)) next.delete(areaID); else next.add(areaID);
  selectedAreas.value = next;
}
function toggleChildren(areaID: string) {
  const next = new Set(childrenAreas.value);
  if (next.has(areaID)) next.delete(areaID); else next.add(areaID);
  childrenAreas.value = next;
}
/** 绘制二维码，使用黑白高对比和四格留白保证微信相机识别。 */
async function drawQr(value: string) {
  await nextTick();
  const code = encode(value, { ecc: 'M', border: 0 });
  const unit = 240 / (code.size + 8);
  const context = uni.createCanvasContext('project-invite-qr', instance?.proxy as any);
  context.setFillStyle('white'); context.fillRect(0, 0, 240, 240); context.setFillStyle('black');
  for (let y = 0; y < code.size; y += 1) for (let x = 0; x < code.size; x += 1) if (code.data[y][x]) context.fillRect((x + 4) * unit, (y + 4) * unit, unit + 0.15, unit + 0.15);
  context.draw();
}
async function handleCreate() {
  if (creating.value) return;
  if (authType.value === 3 && selectedAreas.value.size === 0) { error.value = '只读邀请至少选择一个区域'; return; }
  creating.value = true; error.value = '';
  try {
    const selected = areas.value.filter((area) => selectedAreas.value.has(area.areaID)).map((area) => ({ areaID: area.areaID, isAuthChildren: childrenAreas.value.has(area.areaID) ? 1 : 2 }));
    const result = await createProjectInvite(props.projectID, authType.value, selected);
    qrText.value = encodeProjectInviteQr(result.inviteToken);
    await drawQr(qrText.value);
    emit('created');
    const remaining = Math.max(0, result.expiresAt - Date.now());
    timer = setTimeout(() => { qrText.value = ''; error.value = '二维码已过期，请重新生成'; }, remaining);
  } catch (err) { error.value = (err as Error).message || '生成二维码失败'; }
  finally { creating.value = false; }
}
async function handleRevoke() {
  if (!qrText.value) return;
  const result = await uni.showModal({ title: '撤销二维码', content: '撤销后已截图的二维码也不能继续使用，确定撤销吗？' });
  if (!result.confirm) return;
  // 只保留本地 token 的最小状态，二维码文本中 token 位于前缀之后。
  try {
    await revokeProjectInvite(decodeURIComponent(qrText.value.slice('lianxi-project-invite:v1:'.length)));
    qrText.value = ''; error.value = '二维码已撤销';
  } catch (err) { error.value = (err as Error).message || '撤销失败'; }
}
watch(authType, (value) => { if (value === 3 && areas.value.length === 0) void loadAreas(); });
onMounted(() => { if (authType.value === 3) void loadAreas(); });
onUnmounted(() => { if (timer) clearTimeout(timer); });
</script>

<style lang="scss" scoped>
.invite-mask{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--color-mask)}
.invite-dialog{width:100%;max-width:380px;max-height:90vh;box-sizing:border-box;padding:22px;border-radius:var(--radius-lg);background:var(--card-bg)}
.invite-head{display:flex;align-items:center;justify-content:space-between}.invite-title{font-size:var(--font-section);font-weight:600;color:var(--text-primary)}.invite-close{font-size:28px;color:var(--text-secondary);padding:0 4px}.invite-desc,.invite-expire,.invite-error{display:block;margin-top:8px;font-size:var(--font-caption);line-height:1.5;color:var(--text-secondary)}.invite-error{color:var(--color-danger)}
.invite-auth{display:flex;gap:8px;margin-top:14px}.invite-auth__item{flex:1;padding:10px 7px;border:1px solid var(--border-color);border-radius:10px}.invite-auth__item--active{border-color:var(--color-primary);background:var(--color-primary-light)}.invite-auth__title,.invite-auth__desc{display:block}.invite-auth__title{font-size:var(--font-body);color:var(--text-primary)}.invite-auth__desc{margin-top:4px;font-size:10px;line-height:1.3;color:var(--text-secondary)}
.invite-areas{max-height:190px;margin-top:12px;padding:8px 0;border-radius:10px;background:var(--page-bg)}.invite-area-title{display:block;padding:0 10px 8px;font-size:var(--font-caption);color:var(--text-primary)}.invite-area-state{padding:12px 10px;font-size:var(--font-caption);color:var(--text-secondary)}.invite-area-row{display:flex;align-items:center;gap:8px;padding:9px 10px;font-size:var(--font-caption);color:var(--text-primary)}.invite-check{width:20px;height:20px;line-height:20px;text-align:center;border:1px solid var(--border-color);border-radius:6px;color:var(--color-on-primary)}.invite-check--active{border-color:var(--color-primary);background:var(--color-primary)}.invite-area-children{margin-left:auto;color:var(--color-primary)}
.invite-qr{width:240px;height:240px;margin:16px auto 8px;background:var(--card-bg)}.invite-qr__canvas{width:240px;height:240px}.invite-actions{display:flex;gap:10px}.invite-btn{flex:1;margin-top:16px;padding:12px;text-align:center;border-radius:var(--radius-full);color:var(--color-on-primary);background:var(--color-primary)}.invite-btn--danger{background:var(--color-danger)}
</style>
