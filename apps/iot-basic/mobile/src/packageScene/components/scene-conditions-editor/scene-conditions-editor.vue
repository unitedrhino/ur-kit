<!-- 场景生效条件编辑：保留已有配置，仅在确认时提交草稿。 -->
<template>
  <view class="conditions-page">
    <view class="conditions-header"><view @tap="emit('cancel')">‹</view><text>生效条件</text><view /></view>
    <text class="conditions-tip">触发后先检查禁止时段，再检查生效时段与附加条件。同组多个时段满足任意一个即可。</text>
    <view v-for="group in groups" :key="group.key" class="conditions-section">
      <view class="conditions-title"><text>{{ group.label }}</text><text class="conditions-add" @tap="addRange(group.key)">＋ 添加时段</text></view>
      <text v-if="!draft[group.key].length" class="conditions-empty">{{ group.empty }}</text>
      <view v-for="(range, index) in draft[group.key]" :key="index" class="conditions-card">
        <view class="conditions-row"><text>类型</text><picker mode="selector" :range="rangeLabels" :value="rangeTypeIndex(range)" @change="changeRangeType(group.key, index, $event)"><text class="conditions-link">{{ rangeLabels[rangeTypeIndex(range)] }} ›</text></picker><text class="conditions-delete" @tap="removeRange(group.key, index)">删除</text></view>
        <template v-if="range.type === 'time' && range.timeRange?.type === 'customRange'">
          <view class="conditions-row"><text>开始时间</text><picker mode="time" :value="secondsToTime(range.timeRange.startTime)" @change="setRangeTime(range, 'startTime', $event)"><text class="conditions-link">{{ secondsToTime(range.timeRange.startTime) }} ›</text></picker></view>
          <view class="conditions-row"><text>结束时间</text><picker mode="time" :value="secondsToTime(range.timeRange.endTime)" @change="setRangeTime(range, 'endTime', $event)"><text class="conditions-link">{{ secondsToTime(range.timeRange.endTime) }} ›</text></picker></view>
        </template>
        <template v-if="range.type === 'date' && range.dateRange?.type === 'customRange'">
          <view class="conditions-row"><text>开始日期</text><picker mode="date" :value="range.dateRange.startDate" @change="setRangeDate(range, 'startDate', $event)"><text class="conditions-link">{{ range.dateRange.startDate || '请选择' }} ›</text></picker></view>
          <view class="conditions-row"><text>结束日期</text><picker mode="date" :value="range.dateRange.endDate" @change="setRangeDate(range, 'endDate', $event)"><text class="conditions-link">{{ range.dateRange.endDate || '请选择' }} ›</text></picker></view>
        </template>
        <view v-if="range.type === 'date' && range.dateRange?.type === 'customWeek'" class="week-list"><view v-for="(day, dayIndex) in weekdays" :key="day" :class="['week-item', { 'week-item--active': range.dateRange.repeat?.[dayIndex] === '1' }]" @tap="toggleWeek(range, dayIndex)">{{ day }}</view></view>
      </view>
    </view>
    <view class="conditions-section">
      <view class="conditions-title"><text>附加条件</text><text class="conditions-add" @tap="showAddTerm = !showAddTerm">＋ 添加条件</text></view>
      <view v-if="showAddTerm" class="add-terms"><view @tap="addTerm('property')">设备属性</view><view @tap="addTerm('weather')">天气</view><view @tap="addTerm('time')">时间</view></view>
      <view v-if="draft.conditions.terms.length > 1" class="conditions-row conditions-card"><text>满足方式</text><view class="choices"><view :class="choice(draft.conditions.type === 'and')" @tap="draft.conditions.type = 'and'">全部满足</view><view :class="choice(draft.conditions.type === 'or')" @tap="draft.conditions.type = 'or'">任一满足</view></view></view>
      <text v-if="!draft.conditions.terms.length" class="conditions-empty">不限制附加条件</text>
      <view v-for="(term, index) in draft.conditions.terms" :key="index" class="conditions-card">
        <view class="conditions-row"><text>{{ termLabel(term) }}</text><text class="conditions-delete" @tap="removeTerm(index)">删除</text></view>
        <template v-if="term.columnType === 'property' && term.property">
          <view class="conditions-row" @tap="openDevice(index)"><text>设备</text><text class="conditions-link">{{ term.property.deviceAlias || term.property.deviceName || '请选择' }} ›</text></view>
          <view class="conditions-row" @tap="openSchema(index)"><text>属性</text><text class="conditions-link">{{ term.property.dataName || term.property.dataID || '请选择' }} ›</text></view>
        </template>
        <view v-if="term.columnType === 'weather' && term.weather" class="conditions-row"><text>指标</text><view class="choices"><view :class="choice(term.weather.type === 'temp')" @tap="term.weather.type = 'temp'">温度</view><view :class="choice(term.weather.type === 'humidity')" @tap="term.weather.type = 'humidity'">湿度</view></view></view>
        <template v-if="term.columnType === 'time' && term.time">
          <view class="conditions-row"><text>时间类型</text><picker mode="selector" :range="timeLabels" :value="timeTypeIndex(term)" @change="changeTimeType(term, $event)"><text class="conditions-link">{{ timeLabels[timeTypeIndex(term)] }} ›</text></picker></view>
        </template>
        <template v-if="termData(term)">
          <view class="conditions-row"><text>比较</text><picker mode="selector" :range="compareLabelsFor(term, index)" :value="compareIndex(term, index)" @change="changeCompare(term, index, $event)"><text class="conditions-link">{{ compareText(term, index) }} ›</text></picker></view>
          <view v-for="valueIndex in valueCount(term)" :key="valueIndex" class="conditions-row"><text>{{ valueCount(term) === 2 ? (valueIndex === 1 ? '起始值' : '结束值') : '值' }}</text>
            <picker v-if="term.columnType === 'time' && term.time?.type === 'sys'" mode="time" :value="secondsToTime(Number(termData(term)?.values?.[valueIndex - 1]))" @change="setTermTime(term, valueIndex - 1, $event)"><text class="conditions-link">{{ secondsToTime(Number(termData(term)?.values?.[valueIndex - 1])) }} ›</text></picker>
            <text v-else-if="term.columnType === 'property' && (schemaLoading || schemaErrors[index])" class="conditions-link" @tap="refreshOptions">{{ schemaLoading ? '物模型加载中...' : '物模型加载失败，点击重试' }}</text>
            <view v-else-if="term.columnType === 'property' && discreteOptions[index] !== undefined" class="choices"><view v-for="option in discreteOptions[index]" :key="option.value" :class="choice(term.property?.values?.[0] === option.value)" @tap="setTermValue(term, 0, option.value)">{{ option.label }}</view><text v-if="!discreteOptions[index].length">物模型未配置可选值</text></view>
            <input v-else class="conditions-input" :value="termValueForDisplay(term, valueIndex - 1)" :placeholder="term.columnType === 'time' ? '偏移分钟，负数为提前' : '请输入比较值'" @input="setTermInput(term, valueIndex - 1, $event)" @blur="flushTermInput(term)" />
          </view>
          <text v-if="term.columnType === 'time' && term.time?.type !== 'sys'" class="conditions-tip">相对日出或日落的分钟数，负数表示提前，正数表示延后。</text>
        </template>
        <text v-else class="conditions-tip">该条件类型暂不支持编辑，保留原配置。</text>
      </view>
    </view>
    <button class="conditions-save" @tap="save">确定</button>
    <device-picker :visible="deviceVisible" :product-id="currentTerm?.property?.productID || ''" :selected-name="currentTerm?.property?.deviceName || ''" :devices="devices" :loading="devicesLoading" :error="devicesError" @retry="emit('reloadDevices')" @select="selectDevice" @close="deviceVisible = false" />
    <schema-picker :visible="schemaVisible" :product-id="currentTerm?.property?.productID || ''" schema-type="property-read" :selected-id="currentTerm?.property?.dataID || ''" @select="selectSchema" @close="schemaVisible = false" />
  </view>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { DeviceEntity } from '../../../domain/entities/device.entity';
import type { SceneCondition, Term, WhenRange } from '../../../domain/models/scene-condition.model';
import type { CmpType } from '../../../domain/models/scene-trigger.model';
import { deviceControlService } from '../../../services/device-control.service';
import DevicePicker from '../device-picker/device-picker.vue';
import SchemaPicker from '../schema-picker/schema-picker.vue';
/** modelValue 是已有条件；设备列表与加载状态由页面提供，无插槽。 */
const props = defineProps<{ modelValue: SceneCondition; devices: DeviceEntity[]; devicesLoading: boolean; devicesError: string }>();
/** save 提交完整条件，cancel 丢弃草稿，reloadDevices 重试设备列表。 */
const emit = defineEmits<{ (e: 'save', value: SceneCondition): void; (e: 'cancel'): void; (e: 'reloadDevices'): void }>();
const draft = ref<SceneCondition>(JSON.parse(JSON.stringify(props.modelValue)));
const groups = [{ key: 'validRanges' as const, label: '生效时段', empty: '不限制生效时段' }, { key: 'invalidRanges' as const, label: '禁止时段', empty: '没有禁止时段' }];
const rangeOptions = [{ type: 'time', value: 'allDay', label: '全天' }, { type: 'time', value: 'light', label: '白天（日出至日落）' }, { type: 'time', value: 'night', label: '夜间（日落至日出）' }, { type: 'time', value: 'customRange', label: '自定义时间' }, { type: 'date', value: 'workday', label: '工作日' }, { type: 'date', value: 'weekend', label: '周末' }, { type: 'date', value: 'holiday', label: '节假日' }, { type: 'date', value: 'customWeek', label: '指定星期' }, { type: 'date', value: 'customRange', label: '指定日期' }, { type: 'date', value: 'allDay', label: '所有日期' }] as const;
const rangeLabels = rangeOptions.map(item => item.label);
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const timeTypes = ['sys', 'sunRises', 'sunSet'] as const; const timeLabels = ['系统时间', '日出偏移', '日落偏移'];
const compareValues: CmpType[] = ['eq', 'not', 'gt', 'gte', 'lt', 'lte', 'btw', 'in', 'all']; const compareLabels = ['等于', '不等于', '大于', '大于等于', '小于', '小于等于', '区间内', '属于', '任意值'];
const showAddTerm = ref(false); const currentIndex = ref(-1); const deviceVisible = ref(false); const schemaVisible = ref(false);
const currentTerm = computed(() => draft.value.conditions.terms[currentIndex.value]);
const discreteOptions = ref<Record<number, { value: string; label: string }[]>>({});
const schemaErrors = ref<Record<number, boolean>>({}); const schemaLoading = ref(false);
/** 暂存原生输入法草稿，提交前同步，避免输入过程中重绘。 */
const pendingInputs = new Map<Term, Record<number, string>>();
let schemaRevision = 0;
/** 重新加载现有设备属性的枚举定义，避免编辑时展示错误的自由输入框。 */
async function refreshOptions(): Promise<void> {
  const revision = ++schemaRevision;
  const result: typeof discreteOptions.value = {}; const failed: Record<number, boolean> = {};
  schemaLoading.value = true;
  await Promise.all(draft.value.conditions.terms.map(async (term, index) => {
    if (term.columnType !== 'property' || !term.property?.productID || !term.property.dataID) return;
    try {
      const model = await deviceControlService.getThingModel(term.property.productID);
      const define = model.properties.find(item => item.identifier === term.property?.dataID)?.define;
      if (!define) throw new Error('属性不存在');
      if (!['bool', 'enum'].includes(define.type)) return;
      const mapping = define.type === 'bool' && !Object.keys(define.mapping || {}).length ? { '0': '关', '1': '开' } : (define.mapping || {});
      result[index] = Object.entries(mapping).map(([value, label]) => ({ value, label: String(label) }));
    } catch { failed[index] = true; }
  }));
  if (revision === schemaRevision) { discreteOptions.value = result; schemaErrors.value = failed; schemaLoading.value = false; }
}
watch(() => draft.value.conditions.terms.map(t => `${t.property?.productID || ''}:${t.property?.dataID || ''}`).join('|'), () => { void refreshOptions(); }, { immediate: true });
function choice(active: boolean): string { return active ? 'choice choice--active' : 'choice'; }
function secondsToTime(value?: number): string { const n = Math.max(0, Number(value) || 0); return `${String(Math.floor(n / 3600)).padStart(2, '0')}:${String(Math.floor(n % 3600 / 60)).padStart(2, '0')}`; }
function timeToSeconds(value: string): number { const [h, m] = value.split(':').map(Number); return h * 3600 + m * 60; }
function addRange(group: 'validRanges' | 'invalidRanges'): void { draft.value[group].push({ order: draft.value[group].length, type: 'time', timeRange: { type: 'customRange', startTime: 28800, endTime: 64800 } }); }
function removeRange(group: 'validRanges' | 'invalidRanges', index: number): void { draft.value[group].splice(index, 1); draft.value[group].forEach((item, order) => { item.order = order; }); }
function rangeTypeIndex(range: WhenRange): number { const i = rangeOptions.findIndex(item => item.type === range.type && item.value === (range.type === 'time' ? range.timeRange?.type : range.dateRange?.type)); return Math.max(0, i); }
function changeRangeType(group: 'validRanges' | 'invalidRanges', index: number, event: any): void { const option = rangeOptions[Number(event.detail.value)]; if (!option) return; draft.value[group][index] = option.type === 'time' ? { order: index, type: 'time', timeRange: { type: option.value as 'allDay' | 'light' | 'night' | 'customRange', startTime: 28800, endTime: 64800 } } : { order: index, type: 'date', dateRange: { type: option.value as 'workday' | 'weekend' | 'holiday' | 'customWeek' | 'customRange' | 'allDay', repeat: '1111100', startDate: '', endDate: '' } }; }
function setRangeTime(range: WhenRange, key: 'startTime' | 'endTime', event: any): void { if (range.timeRange) range.timeRange[key] = timeToSeconds(event.detail.value); }
function setRangeDate(range: WhenRange, key: 'startDate' | 'endDate', event: any): void { if (range.dateRange) range.dateRange[key] = String(event.detail.value); }
function toggleWeek(range: WhenRange, index: number): void { if (!range.dateRange) return; const days = (range.dateRange.repeat || '0000000').padEnd(7, '0').slice(0, 7).split(''); days[index] = days[index] === '1' ? '0' : '1'; range.dateRange.repeat = days.join(''); }
function termLabel(term: Term): string { return ({ property: '设备属性', weather: '天气条件', time: '时间条件', event: '事件条件' } as Record<string, string>)[term.columnType] || '其他条件'; }
function addTerm(type: 'property' | 'weather' | 'time'): void { const order = draft.value.conditions.terms.length; const term: Term = { order, columnType: type }; if (type === 'property') term.property = { productID: '', deviceName: '', dataID: '', termType: 'eq', values: [] }; if (type === 'weather') term.weather = { type: 'temp', termType: 'gt', values: ['24'] }; if (type === 'time') term.time = { type: 'sys', termType: 'btw', values: ['28800', '64800'] }; draft.value.conditions.terms.push(term); showAddTerm.value = false; }
function removeTerm(index: number): void { pendingInputs.delete(draft.value.conditions.terms[index]); draft.value.conditions.terms.splice(index, 1); draft.value.conditions.terms.forEach((term, order) => { term.order = order; }); }
function termData(term: Term) { return term.columnType === 'property' ? term.property : term.columnType === 'weather' ? term.weather : term.columnType === 'time' ? term.time : undefined; }
function compareOptions(term: Term, index: number): CmpType[] { return term.columnType === 'property' && discreteOptions.value[index] !== undefined ? ['eq', 'not'] : compareValues; }
function compareLabelsFor(term: Term, index: number): string[] { return compareOptions(term, index).map(value => compareLabels[compareValues.indexOf(value)]); }
function compareIndex(term: Term, index: number): number { return Math.max(0, compareOptions(term, index).indexOf(termData(term)?.termType || 'eq')); }
function compareText(term: Term, index: number): string { const value = termData(term)?.termType || 'eq'; return compareOptions(term, index).includes(value) ? compareLabels[compareValues.indexOf(value)] : '请重新选择'; }
function changeCompare(term: Term, index: number, e: any): void { const data = termData(term); if (!data) return; const next = compareOptions(term, index)[Number(e.detail.value)]; if (!next) return; data.termType = next; if ((next === 'btw' || next === 'in') && !data.values?.[1]) data.values = [data.values?.[0] || '', '']; }
function valueCount(term: Term): number { const type = termData(term)?.termType; return type === 'all' ? 0 : type === 'btw' || type === 'in' ? 2 : 1; }
function setTermValue(term: Term, index: number, value: string): void { const data = termData(term); if (!data) return; const values = [...(data.values || [])]; values[index] = value; data.values = values; }
function setTermTime(term: Term, index: number, event: any): void { setTermValue(term, index, String(timeToSeconds(event.detail.value))); }
function termValueForDisplay(term: Term, index: number): string { const value = termData(term)?.values?.[index] || ''; return term.columnType === 'time' && term.time?.type !== 'sys' && value !== '' ? String(Number(value) / 60) : value; }
function setTermInput(term: Term, index: number, event: any): void { const values = pendingInputs.get(term) || {}; values[index] = String(event.detail.value ?? ''); pendingInputs.set(term, values); }
function flushTermInput(term: Term): void { const values = pendingInputs.get(term); if (!values) return; for (const [index, raw] of Object.entries(values)) setTermValue(term, Number(index), term.columnType === 'time' && term.time?.type !== 'sys' && raw !== '' ? String(Number(raw) * 60) : raw); pendingInputs.delete(term); }
function timeTypeIndex(term: Term): number { return Math.max(0, timeTypes.indexOf((term.time?.type || 'sys') as typeof timeTypes[number])); }
function changeTimeType(term: Term, event: any): void { pendingInputs.delete(term); if (!term.time) return; term.time.type = timeTypes[Number(event.detail.value)] || 'sys'; term.time.values = term.time.type === 'sys' ? ['28800', '64800'] : ['0', '0']; }
function openDevice(index: number): void { currentIndex.value = index; deviceVisible.value = true; emit('reloadDevices'); }
function openSchema(index: number): void { currentIndex.value = index; if (!currentTerm.value?.property?.productID) { uni.showToast({ title: '请先选择设备', icon: 'none' }); return; } schemaVisible.value = true; }
function selectDevice(item: { productID: string; productName: string; deviceName: string; deviceAlias: string }): void { const property = currentTerm.value?.property; if (!property) return; const changed = property.productID !== item.productID; Object.assign(property, item); if (changed) { property.dataID = ''; property.dataName = ''; property.values = []; } deviceVisible.value = false; }
function selectSchema(item: { dataID: string; dataName: string }): void { const property = currentTerm.value?.property; if (!property) return; if (property.dataID !== item.dataID) property.values = []; property.dataID = item.dataID; property.dataName = item.dataName; property.termType = 'eq'; schemaVisible.value = false; }
/** 保存前验证必填项；未编辑的未知条件保留，不擅自覆盖。 */
function save(): void {
  for (const term of draft.value.conditions.terms) flushTermInput(term);
  for (const group of groups) for (const range of draft.value[group.key]) {
    if (range.type === 'time' && range.timeRange?.type === 'customRange' && Number(range.timeRange.startTime) > Number(range.timeRange.endTime)) { uni.showToast({ title: '结束时间不能早于开始时间', icon: 'none' }); return; }
    if (range.type === 'date' && range.dateRange?.type === 'customRange' && (!range.dateRange.startDate || !range.dateRange.endDate || range.dateRange.startDate > range.dateRange.endDate)) { uni.showToast({ title: '请选择有效日期范围', icon: 'none' }); return; }
    if (range.type === 'date' && range.dateRange?.type === 'customWeek' && !range.dateRange.repeat?.includes('1')) { uni.showToast({ title: '请至少选择一天', icon: 'none' }); return; }
  }
  for (const [index, term] of draft.value.conditions.terms.entries()) {
    const data = termData(term); if (!data) { if (['property', 'weather', 'time'].includes(term.columnType)) { uni.showToast({ title: '条件配置不完整，请删除后重新添加', icon: 'none' }); return; } continue; }
    if (term.columnType === 'property' && term.property && (schemaLoading.value || schemaErrors.value[index])) { uni.showToast({ title: '请等待物模型加载或点击重试', icon: 'none' }); return; }
    if (term.columnType === 'property' && term.property && discreteOptions.value[index] !== undefined && !compareOptions(term, index).includes(term.property.termType || 'eq')) { uni.showToast({ title: '请重新选择比较方式', icon: 'none' }); return; }
    if (term.columnType === 'property' && term.property && (!term.property.productID || !term.property.deviceName || !term.property.dataID)) { uni.showToast({ title: '请选择条件设备和属性', icon: 'none' }); return; }
    if (Array.from({ length: valueCount(term) }, (_, i) => data.values?.[i]).some(v => v === undefined || !String(v).trim() || (['time', 'weather'].includes(term.columnType) && !Number.isFinite(Number(v))))) { uni.showToast({ title: '请填写完整条件值', icon: 'none' }); return; }
    if (term.columnType === 'time' && term.time && data.values?.slice(0, valueCount(term)).some(v => Math.abs(Number(v)) > (term.time?.type === 'sys' ? 86400 : 10800) || (term.time?.type === 'sys' && Number(v) < 0))) { uni.showToast({ title: '时间值超出允许范围', icon: 'none' }); return; }
    if (term.columnType === 'weather' && term.weather?.type === 'humidity' && data.values?.slice(0, valueCount(term)).some(v => Number(v) < 0 || Number(v) > 100)) { uni.showToast({ title: '湿度应在 0 到 100 之间', icon: 'none' }); return; }
    if (term.columnType === 'property' && discreteOptions.value[index] !== undefined && !discreteOptions.value[index].some(option => option.value === data.values?.[0])) { uni.showToast({ title: '请选择有效属性值', icon: 'none' }); return; }
  }
  emit('save', JSON.parse(JSON.stringify(draft.value)));
}
</script>
<style scoped lang="scss">
.conditions-page { min-height: 100vh; padding: 12px 16px calc(24px + env(safe-area-inset-bottom)); box-sizing: border-box; color: var(--text-primary); }
.conditions-header, .conditions-title, .conditions-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.conditions-header { min-height: 48px; font-size: var(--font-label); font-weight: 600; }.conditions-header view { min-width: 40px; font-size: 30px; }
.conditions-tip { display: block; padding: 8px 2px; font-size: var(--font-caption); line-height: 1.5; color: var(--text-secondary); }
.conditions-section { margin-top: 20px; }.conditions-title { font-size: var(--font-label); font-weight: 600; }.conditions-add,.conditions-link { color: var(--color-primary); }.conditions-add { font-size: var(--font-body); }
.conditions-empty { display: block; padding: 14px 0; color: var(--text-secondary); font-size: var(--font-caption); }.conditions-card { margin-top: 10px; padding: 4px 14px; border-radius: var(--radius-md); background: var(--card-bg); }
.conditions-row { min-height: 48px; border-bottom: 1px solid var(--border-color); font-size: var(--font-body); }.conditions-row:last-child { border: 0; }.conditions-delete { color: var(--text-secondary); padding: 10px; }.conditions-input { flex: 1; min-width: 0; text-align: right; }
.choices,.week-list,.add-terms { display: flex; flex-wrap: wrap; gap: 6px; }.choice,.week-item,.add-terms view { padding: 7px 10px; border-radius: var(--radius-full); background: var(--color-bg-secondary); font-size: var(--font-caption); }.choice--active,.week-item--active { color: var(--color-primary); background: var(--color-primary-light); }.week-list,.add-terms { padding: 12px 0; }
.conditions-save { margin-top: 24px; min-height: 48px; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-on-primary); font-size: var(--font-body); }
</style>
