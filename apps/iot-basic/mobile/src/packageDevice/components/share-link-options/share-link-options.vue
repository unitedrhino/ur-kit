<!-- 链接分享的权限分组与授权截止时间；链接领取期限由服务端固定控制。 -->
<template>
  <view class="share-options">
    <text class="share-options__label">分享权限</text>
    <view class="share-options__modes">
      <view :class="['share-choice', { 'share-choice--selected': modelValue.authType === 1 }]" role="radio" :aria-checked="modelValue.authType === 1" @tap="setMode(1)"><view class="share-choice__copy"><text class="share-choice__name">全部权限</text><text class="share-choice__desc">包含所有设备功能</text></view><text class="share-choice__radio">{{ modelValue.authType === 1 ? '✓' : '' }}</text></view>
      <view :class="['share-choice', { 'share-choice--selected': modelValue.authType === 2 }]" role="radio" :aria-checked="modelValue.authType === 2" @tap="setMode(2)"><view class="share-choice__copy"><text class="share-choice__name">自定义权限</text><text class="share-choice__desc">按需选择功能</text></view><text class="share-choice__radio">{{ modelValue.authType === 2 ? '✓' : '' }}</text></view>
    </view>
    <view v-if="modelValue.authType === 2" class="share-options__groups">
      <view v-for="group in groups" :key="group.key" class="share-option" role="checkbox" :aria-checked="modelValue.groups.includes(group.key)" @tap="toggleGroup(group.key)">
        <text :class="['share-check', { 'share-check--selected': modelValue.groups.includes(group.key) }]">{{ modelValue.groups.includes(group.key) ? '✓' : '' }}</text>
        <text>{{ group.label }}</text>
      </view>
    </view>
    <text class="share-options__label share-options__label--space">设备授权有效期</text>
    <view class="expiry-presets" aria-label="授权有效期">
      <view v-for="item in presets" :key="item.key" :class="['expiry-preset', { 'expiry-preset--selected': expiryMode === item.key }]" role="button" @tap="chooseExpiry(item.key)">{{ item.label }}</view>
      <view :class="['expiry-preset', { 'expiry-preset--selected': expiryMode === 'custom' }]" role="button" @tap="openCalendar">自定义</view>
    </view>
    <view v-if="modelValue.expDate" class="expiry-summary" @tap="openCalendar">
      <view><text class="expiry-summary__label">授权截止</text><text class="expiry-summary__value">{{ modelValue.expDate }} {{ modelValue.expTime }}</text></view>
      <text class="expiry-summary__edit">修改 ›</text>
    </view>
    <text v-if="link || modelValue.expDate" class="share-options__hint">{{ modelValue.expDate ? '截止后对方将失去授权。' : '' }}{{ link ? '分享链接本身 24 小时内有效。' : '' }}</text>
    <view v-if="calendarOpen" class="calendar-mask" @tap.self="closeCalendar">
      <view class="calendar-dialog" role="dialog" aria-label="选择授权截止时间" @tap.stop>
        <view class="calendar-header"><text class="calendar-title">选择截止时间</text><view class="calendar-close" role="button" aria-label="关闭" @tap="closeCalendar">×</view></view>
        <text class="calendar-description">选择日期和时间，过期后设备授权自动失效</text>
        <view class="calendar-month"><view class="calendar-arrow" role="button" aria-label="上个月" @tap="changeMonth(-1)">‹</view><text>{{ calendarYear }} 年 {{ calendarMonth + 1 }} 月</text><view class="calendar-arrow" role="button" aria-label="下个月" @tap="changeMonth(1)">›</view></view>
        <view class="calendar-grid"><text v-for="day in weekdays" :key="day" class="calendar-weekday">{{ day }}</text><view v-for="cell in calendarCells" :key="cell.key" :class="['calendar-day', { 'calendar-day--disabled': cell.disabled, 'calendar-day--selected': cell.date === draftDate }]" :role="cell.date ? 'button' : undefined" :aria-label="cell.date || undefined" @tap="selectDate(cell.date, cell.disabled)">{{ cell.label }}</view></view>
        <view class="calendar-time"><text>截止时间</text><view class="calendar-time__fields"><input :value="draftHour" type="number" maxlength="2" aria-label="小时" @input="updateHour" /><text>:</text><input :value="draftMinute" type="number" maxlength="2" aria-label="分钟" @input="updateMinute" /></view></view>
        <text v-if="calendarError" class="calendar-error">{{ calendarError }}</text>
        <view class="calendar-actions"><view class="calendar-cancel" role="button" @tap="closeCalendar">取消</view><view class="calendar-confirm" role="button" @tap="confirmCalendar">确定</view></view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ShareLinkOptions, SharePermissionGroup } from '../../../services/device-share-link.service';
/** modelValue 是当前授权选择；组件仅更新表单，不创建分享。 */
const props = defineProps<{modelValue: ShareLinkOptions; link?: boolean}>();
/** update:modelValue 将选择同步给分享页。 */
const emit = defineEmits<{(event: 'update:modelValue', value: ShareLinkOptions): void}>();
/** groups 固定映射受后端支持的权限分组。 */
const groups: Array<{key: SharePermissionGroup; label: string}> = [
  {key:'baseControl', label:'基础控制'}, {key:'deviceSetting', label:'设备设置'},
  {key:'ota', label:'固件升级'}, {key:'deviceTiming', label:'设备定时'}, {key:'hubLog', label:'设备日志'},
];
/** ExpiryMode 区分长期、常用期限与自定义，便于恢复当前选择。 */
type ExpiryMode = 'forever' | 'day' | 'week' | 'month' | 'custom';
/** presets 为用户提供常用的授权时长，按本地时间从选择时刻起计算。 */
const presets: Array<{key: ExpiryMode; label: string}> = [{key:'forever',label:'长期有效'}, {key:'day',label:'1 天'}, {key:'week',label:'7 天'}, {key:'month',label:'30 天'}];
/** expiryMode 仅用于展示选择态；实际合同仍使用本地日期和时间。 */
const expiryMode = ref<ExpiryMode>(props.modelValue.expDate ? 'custom' : 'forever');
/** calendarOpen 和草稿只在确认后写回，取消不改变授权期限。 */
const calendarOpen = ref(false); const draftDate = ref(''); const draftHour = ref('23'); const draftMinute = ref('59'); const calendarError = ref('');
/** calendarYear 与 calendarMonth 控制当前显示的月份。 */
const calendarYear = ref(new Date().getFullYear()); const calendarMonth = ref(new Date().getMonth());
/** weekdays 从周一开始，符合中文日历习惯。 */
const weekdays = ['一','二','三','四','五','六','日'];
/** formatDate 将本地日期转换成接口使用的日期字符串。 */
function formatDate(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
/** calendarCells 显示当前月所有日期，禁止选择今天之前的日期。 */
const calendarCells = computed(() => {
  const first = new Date(calendarYear.value, calendarMonth.value, 1);
  const offset = (first.getDay() + 6) % 7; const count = new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate();
  const today = formatDate(new Date());
  return [...Array.from({length:offset}, (_, i) => ({key:`empty-${i}`,date:'',label:'',disabled:true})), ...Array.from({length:count}, (_, i) => { const date = formatDate(new Date(calendarYear.value, calendarMonth.value, i+1)); return {key:date,date,label:String(i+1),disabled:date < today}; })];
});
/** setMode 切换全部或按分组授权。 */
function setMode(authType: 1 | 2) { emit('update:modelValue', {...props.modelValue, authType}); }
/** toggleGroup 修改单个授权分组。 */
function toggleGroup(key: SharePermissionGroup) { const groups = props.modelValue.groups.includes(key) ? props.modelValue.groups.filter(item => item !== key) : [...props.modelValue.groups, key]; emit('update:modelValue', {...props.modelValue, groups}); }
/** chooseExpiry 按本地日历天数计算快捷期限，长期有效清除截止日期。 */
function chooseExpiry(mode: ExpiryMode) {
  expiryMode.value = mode;
  if (mode === 'forever') { emit('update:modelValue', {...props.modelValue, expDate:'', expTime:'23:59'}); return; }
  const days = mode === 'day' ? 1 : mode === 'week' ? 7 : 30;
  const date = new Date(); date.setDate(date.getDate() + days);
  const time = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  emit('update:modelValue', {...props.modelValue, expDate:formatDate(date), expTime:time});
}
/** openCalendar 初始化独立草稿，重新打开时保留已确认的值。 */
function openCalendar() {
  const today = formatDate(new Date()); draftDate.value = props.modelValue.expDate >= today ? props.modelValue.expDate : today;
  const parts = (props.modelValue.expTime || '23:59').split(':'); draftHour.value = parts[0]; draftMinute.value = parts[1];
  const [year, month] = draftDate.value.split('-').map(Number); calendarYear.value = year; calendarMonth.value = month - 1;
  calendarError.value = ''; calendarOpen.value = true;
}
/** closeCalendar 放弃未确认的日历草稿。 */
function closeCalendar() { calendarOpen.value = false; calendarError.value = ''; }
/** changeMonth 不允许导航到当前月之前。 */
function changeMonth(delta: number) { const next = new Date(calendarYear.value, calendarMonth.value + delta, 1); const now = new Date(); if (next < new Date(now.getFullYear(), now.getMonth(), 1)) return; calendarYear.value = next.getFullYear(); calendarMonth.value = next.getMonth(); }
/** selectDate 仅允许选择有效日期。 */
function selectDate(date: string, disabled: boolean) { if (!date || disabled) return; draftDate.value = date; calendarError.value = ''; }
/** updateHour 与 updateMinute 收集输入草稿，确认时统一校验。 */
function inputValue(event: unknown): string { const e = event as {detail?: {value?: string}; target?: {value?: string}}; return String(e.detail?.value ?? e.target?.value ?? ''); }
function updateHour(event: unknown) { draftHour.value = inputValue(event); calendarError.value = ''; }
function updateMinute(event: unknown) { draftMinute.value = inputValue(event); calendarError.value = ''; }
/** confirmCalendar 校验未来时间并一次性提交日期与时间。 */
function confirmCalendar() {
  if (!/^\d{1,2}$/.test(draftHour.value) || !/^\d{1,2}$/.test(draftMinute.value) || Number(draftHour.value) > 23 || Number(draftMinute.value) > 59) { calendarError.value = '请输入有效的小时和分钟'; return; }
  const time = `${draftHour.value.padStart(2,'0')}:${draftMinute.value.padStart(2,'0')}`;
  const value = new Date(`${draftDate.value}T${time}:00`).getTime();
  if (!Number.isFinite(value) || value <= Date.now()) { calendarError.value = '截止时间须晚于当前时间'; return; }
  emit('update:modelValue', {...props.modelValue, expDate:draftDate.value, expTime:time}); expiryMode.value = 'custom'; closeCalendar();
}
</script>
<style lang="scss" scoped>
.share-options { margin-top: 16px; }
.share-options__label { display: block; font-size: var(--font-body); font-weight: 600; color: var(--text-primary); }
.share-options__label--space { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border-color); }
.share-options__modes, .share-options__groups { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.share-choice { flex: 1 1 135px; min-width: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); box-sizing: border-box; color: var(--text-primary); }
.share-choice--selected { border-color: var(--color-primary); background: var(--color-primary-light); }
.share-choice__copy { min-width: 0; }.share-choice__name, .share-choice__desc { display: block; }.share-choice__name { font-size: var(--font-body); font-weight: 600; }.share-choice__desc { margin-top: 5px; color: var(--text-secondary); font-size: var(--font-caption); line-height: 1.4; }.share-choice__radio { width: 18px; height: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); border-radius: 50%; color: var(--color-on-primary); font-size: 12px; }.share-choice--selected .share-choice__radio { border-color: var(--color-primary); background: var(--color-primary); }
.share-option { padding: 9px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: var(--font-caption); }
.share-option { display: flex; align-items: center; gap: 7px; }
.share-check { width: 16px; height: 16px; border: 1px solid var(--border-color); border-radius: 4px; text-align: center; }
.share-check--selected { color: var(--color-on-primary); background: var(--color-primary); border-color: var(--color-primary); }

.expiry-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.expiry-preset { padding: 9px 8px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-secondary); font-size: var(--font-caption); }
.expiry-preset--selected { color: var(--color-primary); background: var(--color-primary-light); border-color: var(--color-primary); }
.expiry-summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; padding: 12px; background: var(--page-bg); border-radius: var(--radius-sm); }
.expiry-summary__label, .expiry-summary__value { display: block; }.expiry-summary__label { font-size: var(--font-caption); color: var(--text-secondary); }.expiry-summary__value { margin-top: 4px; font-size: var(--font-body); color: var(--text-primary); }.expiry-summary__edit { flex-shrink: 0; color: var(--color-primary); font-size: var(--font-caption); }
.calendar-mask { position: fixed; z-index: 999; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--color-mask); }
.calendar-dialog { box-sizing: border-box; width: 100%; max-width: 380px; max-height: 90vh; overflow-y: auto; padding: 20px; border-radius: var(--radius-lg); background: var(--card-bg); }
.calendar-header, .calendar-month, .calendar-time { display: flex; justify-content: space-between; align-items: center; }.calendar-title { font-size: var(--font-label); font-weight: 600; color: var(--text-primary); }.calendar-close { padding: 0 4px; color: var(--text-secondary); font-size: 28px; line-height: 1; }.calendar-description { display: block; margin-top: 6px; font-size: var(--font-caption); color: var(--text-secondary); line-height: 1.5; }
.calendar-month { margin-top: 14px; font-size: var(--font-body); font-weight: 600; color: var(--text-primary); }.calendar-arrow { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--color-primary); }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; text-align: center; }.calendar-weekday { padding: 8px 0; color: var(--text-secondary); font-size: var(--font-caption); }.calendar-day { display: flex; align-items: center; justify-content: center; height: 38px; border-radius: 50%; font-size: var(--font-body); color: var(--text-primary); }.calendar-day--disabled { color: var(--text-placeholder); }.calendar-day--selected { background: var(--color-primary); color: var(--color-on-primary); }
.calendar-time { margin-top: 14px; padding: 12px; background: var(--page-bg); border-radius: var(--radius-sm); font-size: var(--font-body); color: var(--text-primary); }.calendar-time__fields { display: flex; align-items: center; gap: 5px; font-weight: 600; }.calendar-time__fields input { width: 42px; height: 36px; padding: 0; border-radius: 6px; background: var(--card-bg); text-align: center; }
.calendar-error { display: block; margin-top: 8px; font-size: var(--font-caption); color: var(--color-danger); }.calendar-actions { display: flex; gap: 10px; margin-top: 18px; }.calendar-cancel, .calendar-confirm { flex: 1; padding: 12px; text-align: center; border-radius: var(--radius-full); font-size: var(--font-body); }.calendar-cancel { background: var(--page-bg); color: var(--text-primary); }.calendar-confirm { background: var(--color-primary); color: var(--color-on-primary); }

.share-options__hint { display: block; margin-top: 10px; color: var(--text-secondary); font-size: var(--font-caption); line-height: 1.5; }
</style>
