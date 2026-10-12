<template>
<view :class="`prop-ctrl ${isReadonly ? 'prop-ctrl--readonly' : ''}`">
  <view class="prop-ctrl__header">
    <text class="prop-ctrl__label">{{label}}</text>
    <text class="prop-ctrl__display">{{displayText}}{{define.unit ? ' ' + define.unit : ''}}</text>
  </view>

  <!-- bool: 开关 -->
  <view v-if="define.type === 'bool'" class="prop-ctrl__row prop-ctrl__row--end">
    <switch
      class="prop-ctrl__switch"
      :checked="value === '1' || value === 1 || value === true"
      :disabled="isReadonly"
      @change="handleBoolChange"
    />
  </view>

  <!-- enum: 按钮组 -->
  <view v-else-if="define.type === 'enum'" class="prop-ctrl__chips">
    <view
      v-for="item in enumEntries" :key="item.k"
      :class="`prop-ctrl__chip ${String(value) === item.k ? 'prop-ctrl__chip--active' : ''} ${isReadonly ? 'prop-ctrl__chip--disabled' : ''}`"
      @tap="handleEnumTap(item.k)"
      hover-class="prop-ctrl__chip--hover"
    >
      <text>{{item.v}}</text>
    </view>
  </view>

  <!-- int / float: slider + 确认 -->
  <template v-else-if="define.type === 'int' || define.type === 'float'">
    <view class="prop-ctrl__slider-meta">
      <text>{{sliderMin}}</text>
      <text class="prop-ctrl__slider-value">{{sliderDisplayText}}{{define.unit ? ' ' + define.unit : ''}}</text>
      <text>{{sliderMax}}</text>
    </view>
    <slider
      class="prop-ctrl__slider"
      :value="sliderValue"
      :min="sliderMin"
      :max="sliderMax"
      :step="sliderStep"
      :disabled="isReadonly"
      :activeColor="config.themePrimaryColor"
      :backgroundColor="config.themeBorderColor"
      :block-color="config.themeOnPrimaryColor"
      @changing="handleSliderChanging"
      @change="handleSliderChange"
    />
    <view
      class="prop-ctrl__actions prop-ctrl__actions--slider"
      :class="dirty && !autoCommit ? 'prop-ctrl__actions--active' : 'prop-ctrl__actions--hidden'"
    >
      <view class="prop-ctrl__btn prop-ctrl__btn--cancel" @tap="handleCancel" hover-class="prop-ctrl__btn--hover">
        <text>取消</text>
      </view>
      <view class="prop-ctrl__btn prop-ctrl__btn--primary" @tap="handleCommit" hover-class="prop-ctrl__btn--hover">
        <text>确认</text>
      </view>
    </view>
  </template>

  <!-- string: 输入框 + 确认 -->
  <template v-else-if="define.type === 'string'">
    <view class="prop-ctrl__row">
      <input
        class="prop-ctrl__input"
        type="text"
        v-model="draftTextInput"
        :placeholder="isReadonly ? '' : '请输入'"
        :disabled="isReadonly"
        confirm-type="done"
      />
      <view v-if="dirty && !autoCommit" class="prop-ctrl__actions">
        <view class="prop-ctrl__btn prop-ctrl__btn--cancel" @tap="handleCancel" hover-class="prop-ctrl__btn--hover">
          <text>取消</text>
        </view>
        <view class="prop-ctrl__btn prop-ctrl__btn--primary" @tap="handleCommit" hover-class="prop-ctrl__btn--hover">
          <text>确认</text>
        </view>
      </view>
    </view>
  </template>

  <!-- timestamp: 日期+时间 picker + 确认 -->
  <view v-else-if="define.type === 'timestamp'" class="prop-ctrl__row">
    <picker mode="date" :value="draftDate" :disabled="isReadonly" @change="handleDateChange">
      <view class="prop-ctrl__picker">
        <text>{{draftDate || '选择日期'}}</text>
      </view>
    </picker>
    <picker mode="time" :value="draftTime" :disabled="isReadonly" @change="handleTimeChange">
      <view class="prop-ctrl__picker">
        <text>{{draftTime || '选择时间'}}</text>
      </view>
    </picker>
    <view v-if="dirty && !autoCommit" class="prop-ctrl__actions">
      <view class="prop-ctrl__btn prop-ctrl__btn--cancel" @tap="handleCancel" hover-class="prop-ctrl__btn--hover">
        <text>取消</text>
      </view>
      <view class="prop-ctrl__btn prop-ctrl__btn--primary" @tap="handleCommit" hover-class="prop-ctrl__btn--hover">
        <text>确认</text>
      </view>
    </view>
  </view>

  <!-- 其他类型: 通用输入兜底 -->
  <view v-else class="prop-ctrl__row">
    <input
      class="prop-ctrl__input"
      type="text"
      v-model="draftTextInput"
      :placeholder="isReadonly ? '' : '请输入'"
      :disabled="isReadonly"
      confirm-type="done"
    />
    <view v-if="dirty && !autoCommit" class="prop-ctrl__actions">
      <view class="prop-ctrl__btn prop-ctrl__btn--cancel" @tap="handleCancel" hover-class="prop-ctrl__btn--hover">
        <text>取消</text>
      </view>
      <view class="prop-ctrl__btn prop-ctrl__btn--primary" @tap="handleCommit" hover-class="prop-ctrl__btn--hover">
        <text>确认</text>
      </view>
    </view>
  </view>
</view>

</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { config } from '../../config';
import type { ThingModelDefine } from '../../domain/models/device-control.model';

interface Props {
  /** label 展示物模型属性或行为参数名称。 */
  label?: string;
  /** dataID 记录属性或参数 identifier，change 事件会原样回传。 */
  dataID?: string;
  /** define 描述物模型控件类型、范围、步进、单位和枚举映射。 */
  define?: ThingModelDefine;
  /** value 为当前属性值或行为参数草稿值。 */
  value?: unknown;
  /** mode 表示属性是否只读，行为参数固定传 rw。 */
  mode?: 'r' | 'rw';
  /** autoCommit 为 true 时输入变更立即回传，主要用于行为参数页。 */
  autoCommit?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  label: '',
  dataID: '',
  define: () => ({ type: 'string' } as ThingModelDefine),
  value: undefined,
  mode: 'rw',
  autoCommit: false,
});
const emit = defineEmits<{
  (e: 'change', payload: { dataID: string; rawValue: unknown; commitSeq?: number }): void;
}>();

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function splitTimestamp(value: unknown): { date: string; time: string } {
  const ts = Number(value) || Date.now();
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}
function formatDisplay(define: ThingModelDefine, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (define.type === 'bool') {
    const on = value === true || value === 1 || value === '1';
    if (define.mapping) return define.mapping[on ? '1' : '0'] || (on ? '开' : '关');
    return on ? '开' : '关';
  }
  if (define.type === 'enum' && define.mapping) {
    const k = String(value);
    return define.mapping[k] || k;
  }
  if (define.type === 'timestamp') {
    const ts = Number(value);
    if (!ts) return '—';
    return formatTimestamp(ts);
  }
  return String(value);
}
/** toFiniteNumber 将后端字符串范围安全转换为数字。 */
function toFiniteNumber(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}
/** clampNumber 限制 slider 草稿值不越过物模型范围。 */
function clampNumber(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

const isReadonly = computed(() => props.mode === 'r');
const displayText = computed(() => formatDisplay(props.define, props.value));
const latestCommitSeq = ref(0);
const enumEntries = computed(() => {
  if (props.define.type === 'enum' && props.define.mapping) {
    return Object.keys(props.define.mapping).map((k) => ({ k, v: props.define.mapping![k] }));
  }
  return [] as { k: string; v: string }[];
});
const sliderMin = computed(() => toFiniteNumber(props.define.min, 0));
const sliderMax = computed(() => {
  const min = sliderMin.value;
  const max = toFiniteNumber(props.define.max, min + 100);
  return max > min ? max : min + 100;
});
const sliderStep = computed(() => {
  const fallback = props.define.type === 'float' ? 0.1 : 1;
  const step = toFiniteNumber(props.define.step, fallback);
  return step > 0 ? step : fallback;
});
const sliderValue = computed(() => {
  const raw = draftText.value === '' ? props.value : draftText.value;
  const value = toFiniteNumber(raw, sliderMin.value);
  return clampNumber(value, sliderMin.value, sliderMax.value);
});
const sliderDisplayText = computed(() => {
  if (props.define.type === 'int') return String(Math.round(sliderValue.value));
  return String(Number(sliderValue.value.toFixed(2)));
});

const dirty = ref(false);
const draftText = ref('');
const draftDate = ref('');
const draftTime = ref('');

/** 文本输入草稿的可写代理：v-model 写回草稿，并维护 dirty 状态与 autoCommit 即时回传 */
const draftTextInput = computed({
  get: () => draftText.value,
  set: (text) => {
    draftText.value = text;
    dirty.value = !props.autoCommit;
    if (props.autoCommit) emitFromDraft(text);
  },
});

function syncDraft() {
  if (props.define.type === 'timestamp') {
    const { date, time } = splitTimestamp(props.value);
    draftDate.value = date;
    draftTime.value = time;
    draftText.value = '';
  } else {
    draftText.value = props.value === null || props.value === undefined ? '' : String(props.value);
    draftDate.value = '';
    draftTime.value = '';
  }
}
syncDraft();
watch([() => props.define, () => props.value, () => props.mode], () => {
  if (!dirty.value) syncDraft();
});

function emitCommitResult(payload: { commitSeq: number; success: boolean }) {
  if (!payload.commitSeq || payload.commitSeq !== latestCommitSeq.value) return;
  dirty.value = false;
  if (!payload.success) {
    syncDraft();
  }
}
function emitChangeWithSeq(rawValue: unknown, commitSeq: number) {
  emit('change', { dataID: props.dataID, rawValue, commitSeq });
}
function emitChange(rawValue: unknown) {
  emit('change', { dataID: props.dataID, rawValue });
}
function handleBoolChange(e: any) {
  if (isReadonly.value) return;
  emitChange(e.detail.value ? '1' : '0');
}
function handleEnumTap(k: string) {
  if (isReadonly.value) return;
  emitChange(k);
}
function emitFromDraft(text: string) {
  if (props.define.type === 'int') {
    const n = parseInt(text, 10);
    if (Number.isNaN(n)) return;
    emitChange(n);
  } else if (props.define.type === 'float') {
    const n = parseFloat(text);
    if (Number.isNaN(n)) return;
    emitChange(n);
  } else {
    emitChange(text);
  }
}
/** normalizeSliderValue 将 slider 事件值转换为属性下发使用的数字。 */
function normalizeSliderValue(value: unknown): number {
  const raw = props.define.type === 'int'
    ? parseInt(String(value), 10)
    : parseFloat(String(value));
  const normalized = Number.isNaN(raw) ? sliderMin.value : raw;
  const clamped = clampNumber(normalized, sliderMin.value, sliderMax.value);
  return props.define.type === 'int' ? Math.round(clamped) : clamped;
}
/** handleSliderChanging 仅更新本地草稿，避免拖动中频繁下发。 */
function handleSliderChanging(e: any) {
  if (isReadonly.value) return;
  const value = normalizeSliderValue(e.detail.value);
  draftText.value = String(value);
  dirty.value = !props.autoCommit;
}
/** handleSliderChange 在拖动结束后回填草稿，并按 autoCommit 决定是否立即回传。 */
function handleSliderChange(e: any) {
  if (isReadonly.value) return;
  const value = normalizeSliderValue(e.detail.value);
  draftText.value = String(value);
  dirty.value = !props.autoCommit;
  if (props.autoCommit) emitChange(value);
}
function commitTimestamp() {
  const date = draftDate.value;
  const time = draftTime.value || '00:00';
  if (!date) return;
  const ts = new Date(`${date}T${time}:00`).getTime();
  emitChange(ts);
}
function handleDateChange(e: any) {
  draftDate.value = String(e.detail.value);
  dirty.value = !props.autoCommit;
  if (props.autoCommit) commitTimestamp();
}
function handleTimeChange(e: any) {
  draftTime.value = String(e.detail.value);
  dirty.value = !props.autoCommit;
  if (props.autoCommit) commitTimestamp();
}
function handleCommit() {
  if (isReadonly.value) return;
  let raw: unknown;
  if (props.define.type === 'timestamp') {
    const date = draftDate.value || splitTimestamp(props.value).date;
    const time = draftTime.value || '00:00';
    raw = new Date(`${date}T${time}:00`).getTime();
  } else if (props.define.type === 'int') {
    const n = parseInt(draftText.value, 10);
    if (Number.isNaN(n)) {
      uni.showToast({ title: '请输入整数', icon: 'none' });
      return;
    }
    raw = n;
  } else if (props.define.type === 'float') {
    const n = parseFloat(draftText.value);
    if (Number.isNaN(n)) {
      uni.showToast({ title: '请输入数字', icon: 'none' });
      return;
    }
    raw = n;
  } else {
    raw = draftText.value;
  }
  latestCommitSeq.value += 1;
  dirty.value = true;
  emitChangeWithSeq(raw, latestCommitSeq.value);
}
function handleCancel() {
  dirty.value = false;
  syncDraft();
}

defineExpose({
  handleCommitResult: emitCommitResult,
});
/* eslint-disable */
// import type { ThingModelDefine } from '../../domain/models/device-control.model';
// 
// interface EnumEntry {
//   k: string;
//   v: string;
// }
// 
// function formatDisplay(define: ThingModelDefine, value: unknown): string {
//   if (value === null || value === undefined || value === '') return '—';
//   if (define.type === 'bool') {
//     const on = value === true || value === 1 || value === '1';
//     if (define.mapping) return define.mapping[on ? '1' : '0'] || (on ? '开' : '关');
//     return on ? '开' : '关';
//   }
//   if (define.type === 'enum' && define.mapping) {
//     const k = String(value);
//     return define.mapping[k] || k;
//   }
//   if (define.type === 'timestamp') {
//     const ts = Number(value);
//     if (!ts) return '—';
//     return formatTimestamp(ts);
//   }
//   return String(value);
// }
// 
// function formatTimestamp(ts: number): string {
//   const d = new Date(ts);
//   const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
// }
// 
// function splitTimestamp(value: unknown): { date: string; time: string } {
//   const ts = Number(value) || Date.now();
//   const d = new Date(ts);
//   const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
//   return {
//     date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
//     time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
//   };
// }
// 
// Component({
//   options: {
//     multipleSlots: false,
//   },
//   properties: {
//     label: { type: String, value: '' },
//     /** 属性/参数的 identifier，change 事件会原样回传 */
//     dataID: { type: String, value: '' },
//     /** 物模型 define（对象） */
//     define: { type: Object, value: { type: 'string' } as ThingModelDefine },
//     /** 当前已上报/外部传入的值 */
//     value: { type: null, value: null },
//     /** 'r' | 'rw'，'r' 则整个控件 disabled */
//     mode: { type: String, value: 'rw' },
//     /** true: 输入/选择即时 emit change，不显示确认按钮（用于 action 表单） */
//     autoCommit: { type: Boolean, value: false },
//   },
//   data: {
//     // 派生
//     enumEntries: [] as EnumEntry[],
//     displayText: '—',
//     isReadonly: false,
//     // 编辑态
//     dirty: false,
//     draftText: '',
//     draftDate: '',
//     draftTime: '',
//   },
//   observers: {
//     'define, value, mode': function (define: ThingModelDefine, value: unknown, mode: string) {
//       const def = define || ({ type: 'string' } as ThingModelDefine);
//       const isReadonly = mode === 'r';
//       const patch: Record<string, unknown> = {
//         isReadonly,
//         displayText: formatDisplay(def, value),
//       };
//       if (def.type === 'enum' && def.mapping) {
//         patch.enumEntries = Object.keys(def.mapping).map((k) => ({ k, v: def.mapping![k] }));
//       } else {
//         patch.enumEntries = [];
//       }
//       // 仅在非编辑态时用外部值覆盖草稿，避免打断用户输入
//       if (!this.data.dirty) {
//         if (def.type === 'timestamp') {
//           const { date, time } = splitTimestamp(value);
//           patch.draftDate = date;
//           patch.draftTime = time;
//           patch.draftText = '';
//         } else {
//           patch.draftText = value === null || value === undefined ? '' : String(value);
//           patch.draftDate = '';
//           patch.draftTime = '';
//         }
//       }
//       this.setData(patch);
//     },
//   },
//   methods: {
//     // ---- bool ----
//     handleBoolChange(e: WechatMiniprogram.SwitchChange) {
//       if (this.data.isReadonly) return;
//       this.emit(e.detail.value ? '1' : '0');
//     },
// 
//     // ---- enum ----
//     handleEnumTap(e: WechatMiniprogram.TouchEvent) {
//       if (this.data.isReadonly) return;
//       const k = e.currentTarget.dataset.k as string;
//       this.emit(k);
//     },
// 
//     // ---- int / float / string ----
//     handleTextInput(e: WechatMiniprogram.Input) {
//       const text = e.detail.value;
//       this.setData({ draftText: text, dirty: !this.data.autoCommit });
//       if (this.data.autoCommit) {
//         this.emitFromDraft(text);
//       }
//     },
// 
//     // ---- timestamp ----
//     handleDateChange(e: WechatMiniprogram.PickerChange) {
//       const date = String(e.detail.value);
//       this.setData({ draftDate: date, dirty: !this.data.autoCommit });
//       if (this.data.autoCommit) this.commitTimestamp();
//     },
//     handleTimeChange(e: WechatMiniprogram.PickerChange) {
//       const time = String(e.detail.value);
//       this.setData({ draftTime: time, dirty: !this.data.autoCommit });
//       if (this.data.autoCommit) this.commitTimestamp();
//     },
// 
//     emitFromDraft(text: string) {
//       const def = this.data.define as ThingModelDefine;
//       if (def.type === 'int') {
//         const n = parseInt(text, 10);
//         if (Number.isNaN(n)) return;
//         this.emit(n);
//       } else if (def.type === 'float') {
//         const n = parseFloat(text);
//         if (Number.isNaN(n)) return;
//         this.emit(n);
//       } else {
//         this.emit(text);
//       }
//     },
// 
//     commitTimestamp() {
//       const date = this.data.draftDate;
//       const time = this.data.draftTime || '00:00';
//       if (!date) return;
//       const ts = new Date(`${date}T${time}:00`).getTime();
//       this.emit(ts);
//     },
// 
//     // ---- 确认 / 取消 ----
//     handleCommit() {
//       if (this.data.isReadonly) return;
//       const def = this.data.define as ThingModelDefine;
//       let raw: unknown;
//       if (def.type === 'timestamp') {
//         const date = this.data.draftDate || splitTimestamp(this.data.value).date;
//         const time = this.data.draftTime || '00:00';
//         const ts = new Date(`${date}T${time}:00`).getTime();
//         raw = ts;
//       } else if (def.type === 'int') {
//         const n = parseInt(this.data.draftText, 10);
//         if (Number.isNaN(n)) {
//           wx.showToast({ title: '请输入整数', icon: 'none' });
//           return;
//         }
//         raw = n;
//       } else if (def.type === 'float') {
//         const n = parseFloat(this.data.draftText);
//         if (Number.isNaN(n)) {
//           wx.showToast({ title: '请输入数字', icon: 'none' });
//           return;
//         }
//         raw = n;
//       } else {
//         raw = this.data.draftText;
//       }
//       this.setData({ dirty: false });
//       this.emit(raw);
//     },
//     handleCancel() {
//       this.setData({ dirty: false });
//       // 触发一次 observer 用外部值重置草稿
//       this.setData({ value: this.data.value });
//     },
// 
//     emit(rawValue: unknown) {
//       this.triggerEvent('change', { dataID: this.data.dataID, rawValue });
//     },
//   },
// });
// 
</script>

<style lang="scss" scoped>
.prop-ctrl {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  border-bottom: 1rpx solid var(--divider);
}

.prop-ctrl--readonly {
  opacity: 0.75;
}

.prop-ctrl__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.prop-ctrl__label {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.prop-ctrl__display {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 180px;
  text-align: right;
}

.prop-ctrl__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prop-ctrl__row--end {
  justify-content: flex-end;
}

.prop-ctrl__switch {
  transform: scale(0.9);
}

.prop-ctrl__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prop-ctrl__chip {
  padding: 6px 14px;
  background: var(--color-bg-secondary);
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-primary);
}

.prop-ctrl__chip--active {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.prop-ctrl__chip--hover {
  opacity: 0.7;
}

.prop-ctrl__chip--disabled {
  opacity: 0.5;
}

.prop-ctrl__input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary);
}

.prop-ctrl__slider-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.prop-ctrl__slider-value {
  max-width: 140px;
  min-width: 56px;
  padding: 4px 8px;
  border-radius: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prop-ctrl__slider {
  margin: 8px 0 0;
}

.prop-ctrl__picker {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.prop-ctrl__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  min-height: 40px;
}

.prop-ctrl__actions--hidden {
  visibility: hidden;
  pointer-events: none;
}

.prop-ctrl__actions--slider {
  justify-content: flex-end;
  margin-top: 8px;
}

.prop-ctrl__btn {
  min-width: 56px;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.prop-ctrl__btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.prop-ctrl__btn--cancel {
  background: var(--color-bg-secondary);
  color: var(--text-secondary);
  border: 1rpx solid var(--border-color);
}

.prop-ctrl__btn--hover {
  opacity: 0.7;
}

</style>
