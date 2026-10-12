<!--
  设备控制弹窗：以居中 Dialog 承载单控/群控，负责拉取控制 schema、收集改动并下发。
-->
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import {
  CONTROL_SCHEMA_TYPE_ACTION,
  CONTROL_SCHEMA_TYPE_PROPERTY,
  type ControlFailureState,
  type ControlPrimitiveValue,
  type DeviceRow,
  type ControlSchemaItem,
} from './device-control-model';

import { computed, ref, watch } from 'vue';

import { ThingsApi } from '@vben/api';
import { message } from '@vben/saas';
import { $t } from '@vben/locales';
import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@unitedrhino/saas-ui/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@unitedrhino/saas-ui/ui/dropdown-menu';
import { Slider } from '@unitedrhino/saas-ui/ui/slider';
import { Spinner } from '@unitedrhino/saas-ui/ui/spinner';
import { Switch } from '@unitedrhino/saas-ui/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@unitedrhino/saas-ui/ui/toggle-group';

import { extractList } from '#/utils/api-response';

import {
  buildChangedControlPayload,
  buildChangedActionItems,
  buildControlDevices,
  buildDeviceKey,
  buildFailedControlMap,
  buildRetryDevices,
  buildSchemaRequest,
  collectFailedControlResults,
  isMissingControlModeColumnError,
  normalizeControlSchemas,
  selectRowsByKeys,
} from './device-control-model';

const props = defineProps<{
  /** open 控制弹窗显隐。 */
  open: boolean;
  /** rows 本次单控或群控的设备目标行。 */
  rows: DeviceRow[];
  /** selectedKeys 外部设备列表当前勾选的设备 key，用于群控时和列表选择状态同步。 */
  selectedKeys?: string[];
  /** projectID 当前组织项目 ID，用于补齐行为物模型查询参数，空值按未传处理。 */
  projectID?: null | string;
  /** projectId 为与模板短横线属性兼容的驼峰写法，空值按未传处理。 */
  projectId?: null | string;
}>();

const emit = defineEmits<{
  /** refresh 控制成功后通知控制台刷新设备列表。 */
  refresh: [];
  /** update:selectedKeys 群控弹窗内重选设备后同步外部列表选中状态。 */
  'update:selectedKeys': [keys: string[]];
  /** update:open 同步弹窗显隐状态。 */
  'update:open': [open: boolean];
}>();

type CheckedState = boolean | 'indeterminate';

type ActionRequestRow = { deviceName: string; productID: string };

type ActionInputSource = ControlPrimitiveValue | undefined;

const dialogOpen = computed({
  get: () => props.open,
  set: (open: boolean) => emit('update:open', open),
});

const loading = ref(false);
const sending = ref(false);
const schemaError = ref('');
const failedControlMap = ref<Record<string, ControlFailureState>>({});
const retryingIdentifiers = ref<Record<string, boolean>>({});
const controls = ref<ControlSchemaItem[]>([]);
const changedValues = ref<Record<string, ControlPrimitiveValue | undefined>>({});
/** changedActionIdentifiers 记录行为项是否进入待下发状态。 */
const changedActionIdentifiers = ref<Record<string, boolean>>({});
const requestSeq = ref(0);
const targetDeviceKeys = ref<string[]>([]);
const targetRows = ref<DeviceRow[]>([]);
const devicePickerOpen = ref(false);
const requestProjectID = computed(() => props.projectID || props.projectId || undefined);

const isGroupControl = computed(() => targetRows.value.length > 1);
const canPickDevices = computed(() => props.rows.length > 1);
const productCount = computed(() => new Set(targetRows.value.map((row) => row.productID).filter(Boolean)).size);
const editableControlIdentifiers = computed(() =>
  new Set(
    controls.value
      .filter((item) => getSchemaType(item) === CONTROL_SCHEMA_TYPE_PROPERTY && item.isReadonly !== true)
      .map((item) => item.identifier),
  ),
);
/** changedPropertyCount 当前可写属性中已改动、待下发的数量。 */
const changedPropertyCount = computed(() => Object.keys(buildChangedControlPayload(changedValues.value, editableControlIdentifiers.value)).length);
/** changedActionCount 当前行为中已选中、待下发的数量。 */
const changedActionCount = computed(() => buildChangedActionItems(controls.value, changedActionIdentifiers.value).length);
/** changedCount 汇总属性改动与行为选中数量，用于弹窗头部提示和下发按钮禁用判断。 */
const changedCount = computed(() => changedPropertyCount.value + changedActionCount.value);
const hasActionItemsToApply = computed(() => changedActionCount.value > 0);
const orderedControls = computed(() => {
  const list = [...controls.value];
  return list.sort((a, b) => {
    const getPriority = (item: ControlSchemaItem) => {
      const type = getSchemaType(item);
      if (type === CONTROL_SCHEMA_TYPE_PROPERTY && item.isReadonly !== true) {
        return 0;
      }
      if (type === CONTROL_SCHEMA_TYPE_ACTION) {
        return 1;
      }
      return 2;
    };

    const delta = getPriority(a) - getPriority(b);
    if (delta !== 0) {
      return delta;
    }
    return String(a.identifier).localeCompare(String(b.identifier));
  });
});
const anyRetrying = computed(() => Object.values(retryingIdentifiers.value).some(Boolean));
const headerBadgeClass = 'h-10 px-3 text-sm font-medium';
const title = computed(() => (isGroupControl.value ? $t('orgIotClient.console.groupControlTitle') : $t('orgIotClient.console.singleControlTitle')));
const selectedDeviceLabel = computed(() => targetRows.value.map((row) => row.deviceAlias || row.deviceName).join(', ') || $t('orgIotClient.console.selectDeviceFallback'));
const modeDescription = computed(() =>
  $t('orgIotClient.console.controlDesc'),
);

function resetState() {
  schemaError.value = '';
  failedControlMap.value = {};
  retryingIdentifiers.value = {};
  controls.value = [];
  changedValues.value = {};
  changedActionIdentifiers.value = {};
  targetDeviceKeys.value = [];
  targetRows.value = [];
}

/** resetChangedControls 清理所有待下发状态，并将属性值与行为参数还原为初始显示。 */
function resetChangedControls() {
  changedValues.value = {};
  changedActionIdentifiers.value = {};
  failedControlMap.value = {};
}

function isActionControl(item: ControlSchemaItem) {
  return getSchemaType(item) === CONTROL_SCHEMA_TYPE_ACTION;
}

function isReadonlyProperty(item: ControlSchemaItem) {
  return getSchemaType(item) === CONTROL_SCHEMA_TYPE_PROPERTY && item.isReadonly === true;
}

function isEditableProperty(item: ControlSchemaItem) {
  return getSchemaType(item) === CONTROL_SCHEMA_TYPE_PROPERTY && item.isReadonly !== true;
}

function getSchemaType(item: ControlSchemaItem) {
  const direct = Number(item.schemaType);
  if (Number.isFinite(direct)) {
    return direct;
  }
  return Number(item.type ?? CONTROL_SCHEMA_TYPE_PROPERTY);
}

function getDisplayValue(item: ControlSchemaItem) {
  const changedValue = changedValues.value[item.identifier];
  if (changedValue !== undefined) {
    return changedValue;
  }
  if (item.initialValue !== undefined) {
    return item.initialValue;
  }
  const define = item.affordance?.define;
  if (define?.type === 'bool') {
    return false;
  }
  if (define?.type === 'enum') {
    return define.mapping?.[0]?.value ?? '';
  }
  if (define?.type === 'int' || define?.type === 'float') {
    return define.start ?? 0;
  }
  return '';
}

function getDisplayLabel(item: ControlSchemaItem) {
  const value = getDisplayValue(item);
  if (item.affordance?.define?.type === 'bool') {
    return Number(value) === 1 || value === true ? $t('orgIotClient.console.on') : $t('orgIotClient.console.off');
  }
  if (item.affordance?.define?.type === 'enum') {
    const selectedValue = String(value);
    const option = item.affordance.define?.mapping?.find((item) => String(item.value) === selectedValue);
    return option?.label || selectedValue;
  }
  return value;
}

function getActionInputValue(item: ControlSchemaItem) {
  const changedValue = changedValues.value[item.identifier];
  if (changedValue !== undefined) {
    return String(changedValue);
  }
  if (item.initialValue !== undefined) {
    return String(item.initialValue);
  }
  return '';
}

function onActionInputChange(item: ControlSchemaItem, text: string) {
  changedValues.value = {
    ...changedValues.value,
    [item.identifier]: text,
  };
  setActionChanged(item.identifier, true);
}

/** clearControlFailure 清理单个控制项的失败状态，避免取消改动后继续显示旧错误。 */
function clearControlFailure(identifier: string) {
  if (!failedControlMap.value[identifier]) {
    return;
  }
  const next = { ...failedControlMap.value };
  delete next[identifier];
  failedControlMap.value = next;
}

/** clearChangedValue 还原单个控制项的临时值，让界面回到物模型初始值。 */
function clearChangedValue(identifier: string) {
  const next = { ...changedValues.value };
  delete next[identifier];
  changedValues.value = next;
  clearControlFailure(identifier);
}

/** setActionChanged 维护行为项与属性项一致的改动/选中状态。 */
function setActionChanged(identifier: string, changed: boolean) {
  const next = { ...changedActionIdentifiers.value };
  if (changed) {
    next[identifier] = true;
  } else {
    delete next[identifier];
    clearChangedValue(identifier);
  }
  changedActionIdentifiers.value = next;
  clearControlFailure(identifier);
}

/** isControlChanged 判断属性或行为是否处于待下发状态。 */
function isControlChanged(item: ControlSchemaItem) {
  if (isActionControl(item)) {
    return changedActionIdentifiers.value[item.identifier] === true;
  }
  if (isEditableProperty(item)) {
    return changedValues.value[item.identifier] !== undefined;
  }
  return false;
}

/** getPropertySubmitValue 将当前显示值转换成属性下发需要的基础类型。 */
function getPropertySubmitValue(item: ControlSchemaItem): ControlPrimitiveValue {
  const value = getDisplayValue(item);
  if (item.affordance?.define?.type === 'bool') {
    return Number(value) === 1 || value === true ? 1 : 0;
  }
  if (item.affordance?.define?.type === 'int') {
    return Number.parseInt(String(value), 10);
  }
  if (item.affordance?.define?.type === 'float') {
    return Number(value);
  }
  return String(value);
}

/** toggleControlItem 通过点击 item 外框切换待下发状态，取消属性时同步还原临时值。 */
function toggleControlItem(item: ControlSchemaItem) {
  if (isActionControl(item)) {
    setActionChanged(item.identifier, !isControlChanged(item));
    return;
  }
  if (!isEditableProperty(item)) {
    return;
  }
  if (isControlChanged(item)) {
    clearChangedValue(item.identifier);
    return;
  }
  setChangedValue(item.identifier, getPropertySubmitValue(item));
}

function buildActionInputPayload(item: ControlSchemaItem, input: ActionInputSource = changedValues.value[item.identifier]) {
  const raw = input ?? getActionInputValue(item);
  if (raw === undefined) {
    return undefined;
  }
  const trimmed = String(raw).trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    throw new Error($t('orgIotClient.console.actionParamInvalidJson', { name: item.name || item.identifier }));
  }
}

function setChangedValue(identifier: string, value: ControlPrimitiveValue | undefined) {
  if (value === undefined) {
    clearChangedValue(identifier);
    return;
  }
  changedValues.value = {
    ...changedValues.value,
    [identifier]: value,
  };
  clearControlFailure(identifier);
}

function onBoolChange(item: ControlSchemaItem, checked: boolean) {
  setChangedValue(item.identifier, checked ? 1 : 0);
}

function onEnumChange(item: ControlSchemaItem, value: unknown) {
  const selectedValue = Array.isArray(value) ? value[0] : value;
  if (selectedValue === null || selectedValue === undefined) {
    return;
  }
  setChangedValue(item.identifier, String(selectedValue));
}

function onNumberChange(item: ControlSchemaItem, rawValue: number | string) {
  const text = String(rawValue).trim();
  if (!text) {
    setChangedValue(item.identifier, undefined);
    return;
  }
  const value = item.affordance?.define?.type === 'int' ? Number.parseInt(text, 10) : Number(text);
  if (Number.isFinite(value)) {
    setChangedValue(item.identifier, value);
  }
}

function onNumberSliderChange(item: ControlSchemaItem, rawValue: number[] | undefined) {
  onNumberChange(item, rawValue?.[0] ?? '');
}

function initializeTargetRows() {
  const propSelectedKeys = props.selectedKeys ?? [];
  const selectedRows = propSelectedKeys.length > 0 ? selectRowsByKeys(props.rows, propSelectedKeys) : [];
  targetRows.value = selectedRows.length > 0 ? selectedRows : [...props.rows];
  targetDeviceKeys.value = targetRows.value.map((row) => buildDeviceKey(row));
}

async function loadPropertySchemaList(rows: DeviceRow[], propertyMode: 'r' | 'rw') {
  let response;
  try {
    response = await ThingsApi.postApiV1ThingsSchemaCommonGetList(buildSchemaRequest(rows, { propertyMode }) as any);
  } catch (error) {
    if (rows.length <= 1 || !isMissingControlModeColumnError(error)) {
      throw error;
    }
    response = await ThingsApi.postApiV1ThingsSchemaCommonGetList(buildSchemaRequest(rows, { propertyMode, omitControlMode: true }) as any);
  }
  return extractList(response);
}

async function loadActionSchemaList(rows: DeviceRow[]) {
  return extractList(
    await ThingsApi.postApiV1ThingsSchemaCommonGetList(
      buildSchemaRequest(rows, {
        projectID: requestProjectID.value,
        omitControlMode: true,
        omitPropertyMode: true,
        productSceneMode: 'rw',
        type: CONTROL_SCHEMA_TYPE_ACTION,
      }) as any,
    ),
  );
}

async function loadControls(rows = targetRows.value) {
  if (!props.open || rows.length === 0) {
    resetState();
    return;
  }

  const seq = ++requestSeq.value;
  loading.value = true;
  schemaError.value = '';
  failedControlMap.value = {};
  retryingIdentifiers.value = {};
  changedValues.value = {};
  changedActionIdentifiers.value = {};

  try {
    const [rwSchemas, roSchemas, actionSchemas] = await Promise.all([
      loadPropertySchemaList(rows, 'rw'),
      loadPropertySchemaList(rows, 'r'),
      loadActionSchemaList(rows),
    ]);

    if (seq !== requestSeq.value) {
      return;
    }

    controls.value = normalizeControlSchemas([...rwSchemas, ...roSchemas, ...actionSchemas], rows);
  } catch (error: any) {
    if (seq === requestSeq.value) {
      schemaError.value = error?.message || $t('orgIotClient.console.schemaLoadFailed');
      controls.value = [];
    }
  } finally {
    if (seq === requestSeq.value) {
      loading.value = false;
    }
  }
}

function applyTargetDeviceKeys(keys: string[]) {
  const selectedRows = selectRowsByKeys(props.rows, [...new Set(keys.map(String))]);
  if (selectedRows.length === 0) {
    message.warning($t('orgIotClient.console.keepOneControlDevice'));
    return;
  }

  targetDeviceKeys.value = selectedRows.map((row) => buildDeviceKey(row));
  targetRows.value = selectedRows;
  emit('update:selectedKeys', targetDeviceKeys.value);
  loadControls(targetRows.value);
}

function onTargetDeviceCheckedChange(row: DeviceRow, checked: CheckedState) {
  const key = buildDeviceKey(row);
  const nextKeys = new Set(targetDeviceKeys.value);

  if (checked === true) {
    nextKeys.add(key);
  } else {
    nextKeys.delete(key);
  }

  applyTargetDeviceKeys([...nextKeys]);
}

function setControlFailure(identifier: string, failure: ControlFailureState | undefined) {
  const next = { ...failedControlMap.value };
  if (failure) {
    next[identifier] = failure;
  } else {
    delete next[identifier];
  }
  failedControlMap.value = next;
}

async function sendAction(item: ControlSchemaItem, rows: ActionRequestRow[], input: string | undefined) {
  const failures: { code?: number | string; deviceName?: string; msg?: string; productID?: string }[] = [];
  await Promise.all(
    rows.map(async (row) => {
      try {
        const response = await ThingsApi.postApiV1ThingsDeviceInteractActionSend({
          productID: row.productID,
          deviceName: row.deviceName,
          actionID: item.identifier,
          ...(input ? { inputParams: input } : {}),
        });
        const code = Number((response as any)?.code);
        if (code !== 200) {
          failures.push({
            productID: row.productID,
            deviceName: row.deviceName,
            code: Number((response as any)?.code),
            msg: String((response as any)?.msg || ''),
          });
        }
      } catch (error: any) {
        failures.push({
          code: 'error',
          deviceName: row.deviceName,
          msg: error?.message || $t('orgIotClient.console.actionCallFailed'),
          productID: row.productID,
        });
      }
    }),
  );

  return failures;
}

async function executeAction(item: ControlSchemaItem, rows: ActionRequestRow[]) {
  retryingIdentifiers.value = {
    ...retryingIdentifiers.value,
    [item.identifier]: true,
  };

  try {
    const input = buildActionInputPayload(item);
    const failures = await sendAction(item, rows, input);
    if (failures.length > 0) {
      setControlFailure(item.identifier, buildFailedControlMap({ [item.identifier]: 1 }, failures)[item.identifier]);
      return;
    }

    setControlFailure(item.identifier, undefined);
    message.success($t('orgIotClient.console.actionTriggered', { name: item.name || item.identifier }));
    emit('refresh');
  } catch (error: any) {
    setControlFailure(
      item.identifier,
      buildFailedControlMap({ [item.identifier]: 1 }, [{ code: 'error', msg: error?.message || $t('orgIotClient.console.actionParamInvalid') }])[item.identifier],
    );
    notifyRequestError(error, () => error?.message || $t('orgIotClient.console.actionExecFailed'), (text) => message.error(text));
  } finally {
    retryingIdentifiers.value = {
      ...retryingIdentifiers.value,
      [item.identifier]: false,
    };
  }
}

async function executeProperty(item: ControlSchemaItem, rows: ActionRequestRow[]) {
  const value = changedValues.value[item.identifier];
  if (value === undefined) {
    message.warning($t('orgIotClient.console.adjustControlsFirst'));
    return;
  }

  retryingIdentifiers.value = {
    ...retryingIdentifiers.value,
    [item.identifier]: true,
  };
  setControlFailure(item.identifier, undefined);

  try {
    const payload = { [item.identifier]: value } as Record<string, ControlPrimitiveValue>;
    const response = await ThingsApi.postApiV1ThingsDeviceInteractPropertyControlBatchSend({
      devices: rows,
      data: JSON.stringify(payload),
      shadowControl: 0,
    });
    const failed = collectFailedControlResults(extractList(response));

    if (failed.length > 0) {
      setControlFailure(item.identifier, buildFailedControlMap(payload, failed)[item.identifier]);
      return;
    }

    setControlFailure(item.identifier, undefined);
    message.success($t('orgIotClient.console.actionExecuted', { name: item.name || item.identifier }));
    emit('refresh');
  } catch (error: any) {
    const errorMessage = error?.message || $t('orgIotClient.console.propDispatchFailed');
    setControlFailure(item.identifier, buildFailedControlMap({ [item.identifier]: value }, [{ code: 'error', msg: errorMessage }])[item.identifier]);
    notifyRequestError(error, () => errorMessage, (text) => message.error(text));
  } finally {
    retryingIdentifiers.value = {
      ...retryingIdentifiers.value,
      [item.identifier]: false,
    };
  }
}

function onActionExecute(item: ControlSchemaItem) {
  return executeAction(item, buildControlDevices(targetRows.value));
}

function onPropertyExecute(item: ControlSchemaItem) {
  return executeProperty(item, buildControlDevices(targetRows.value));
}

/** getChangedActionItems 返回当前批量下发中真正需要执行的行为项。 */
function getChangedActionItems() {
  return buildChangedActionItems(controls.value, changedActionIdentifiers.value);
}

function setActionFailure(identifier: string, failures: { msg?: string; code?: number | string; deviceName?: string; productID?: string }[]) {
  if (!failures.length) {
    setControlFailure(identifier, undefined);
    return false;
  }
  setControlFailure(identifier, buildFailedControlMap({ [identifier]: 1 }, failures)[identifier]);
  return true;
}

async function onApply() {
  const payload = buildChangedControlPayload(changedValues.value, editableControlIdentifiers.value);
  const actionItems = getChangedActionItems();
  if (Object.keys(payload).length === 0 && actionItems.length === 0) {
    message.warning($t('orgIotClient.console.adjustDispatchFirst'));
    return;
  }

  sending.value = true;
  failedControlMap.value = {};
  const actionRows = buildControlDevices(targetRows.value);
  let hasFailure = false;

  try {
    if (Object.keys(payload).length > 0) {
      const response = await ThingsApi.postApiV1ThingsDeviceInteractPropertyControlBatchSend({
        devices: actionRows,
        data: JSON.stringify(payload),
        shadowControl: 0,
      });
      const failed = collectFailedControlResults(extractList(response));

      if (failed.length > 0) {
        failedControlMap.value = {
          ...failedControlMap.value,
          ...buildFailedControlMap(payload, failed),
        };
        hasFailure = true;
      }
    }

    await Promise.all(
      actionItems.map(async (item) => {
        retryingIdentifiers.value = {
          ...retryingIdentifiers.value,
          [item.identifier]: true,
        };
        try {
          const input = buildActionInputPayload(item);
          const actionFailures = await sendAction(item, actionRows, input);
          const failed = setActionFailure(item.identifier, actionFailures);
          if (failed) {
            hasFailure = true;
          }
          if (Object.keys(changedValues.value).length > 0 && failedControlMap.value[item.identifier]) {
            // keep current behavior: action failures shown on row with retry button
          }
        } catch (error: any) {
          const failed = setActionFailure(item.identifier, [{ code: 'error', msg: error?.message || $t('orgIotClient.console.actionParamInvalid') }]);
          if (failed) {
            hasFailure = true;
          }
        } finally {
          retryingIdentifiers.value = {
            ...retryingIdentifiers.value,
            [item.identifier]: false,
          };
        }
      }),
    );

    if (hasFailure) {
      return;
    }

    message.success($t('orgIotClient.console.controlsDispatched'));
    emit('refresh');
    dialogOpen.value = false;
  } catch (error: any) {
    const errorMessage = error?.message || $t('orgIotClient.console.controlDispatchFailed');
    failedControlMap.value = buildFailedControlMap(payload, [{ code: 'error', msg: errorMessage }]);
  } finally {
    sending.value = false;
  }
}

async function retryControlItem(item: ControlSchemaItem) {
  if (isActionControl(item)) {
    const retryRows = buildRetryDevices(targetRows.value, failedControlMap.value[item.identifier]?.results);
    await executeAction(item, retryRows);
    return;
  }

  const value = changedValues.value[item.identifier];
  if (value === undefined) {
    message.warning($t('orgIotClient.console.adjustRetryFirst'));
    return;
  }

  const retryResults = failedControlMap.value[item.identifier]?.results;
  retryingIdentifiers.value = {
    ...retryingIdentifiers.value,
    [item.identifier]: true,
  };
  setControlFailure(item.identifier, undefined);

  try {
    const payload = { [item.identifier]: value } as Record<string, ControlPrimitiveValue>;
    const response = await ThingsApi.postApiV1ThingsDeviceInteractPropertyControlBatchSend({
      devices: buildRetryDevices(targetRows.value, retryResults),
      data: JSON.stringify(payload),
      shadowControl: 0,
    });
    const failed = collectFailedControlResults(extractList(response));

    if (failed.length > 0) {
      setControlFailure(item.identifier, buildFailedControlMap(payload, failed)[item.identifier]);
      return;
    }

    setControlFailure(item.identifier, undefined);
    message.success($t('orgIotClient.console.retrySucceeded', { name: item.name || item.identifier }));
    emit('refresh');
  } catch (error: any) {
    const errorMessage = error?.message || $t('orgIotClient.console.controlRetryFailed');
    setControlFailure(item.identifier, buildFailedControlMap({ [item.identifier]: value }, [{ code: 'error', msg: errorMessage }])[item.identifier]);
  } finally {
    retryingIdentifiers.value = {
      ...retryingIdentifiers.value,
      [item.identifier]: false,
    };
  }
}

watch(
  () => [props.open, props.rows] as const,
  ([open]) => {
    if (open) {
      initializeTargetRows();
      loadControls(targetRows.value);
    } else {
      resetState();
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent
      class="flex h-[92vh] w-[calc(100vw-24px)] max-w-[840px] flex-col gap-0 overflow-hidden p-0 sm:h-[86vh]"
    >
      <DialogHeader class="border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <DialogTitle>{{ title }}</DialogTitle>
              <Badge :class="headerBadgeClass" variant="secondary">{{ isGroupControl ? $t('orgIotClient.console.badgeGroupControl') : $t('orgIotClient.console.badgeSingleControl') }}</Badge>
              <DropdownMenu v-if="canPickDevices" v-model:open="devicePickerOpen">
                <DropdownMenuTrigger as-child>
                  <Button
                    :title="selectedDeviceLabel"
                    :aria-expanded="devicePickerOpen"
                    class="border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring h-10 w-full justify-between rounded-md border bg-transparent px-3 py-2 text-sm font-normal shadow-sm hover:bg-transparent focus:outline-none focus:ring-1 sm:w-[180px]"
                    role="combobox"
                    variant="outline"
                  >
                    <span class="truncate text-left">{{ selectedDeviceLabel }}</span>
                    <span class="icon-[lucide--chevron-down] ml-2 size-4 shrink-0 opacity-50"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-[180px]">
                  <DropdownMenuLabel>{{ $t('orgIotClient.console.devices') }}</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    v-for="row in rows"
                    :key="buildDeviceKey(row)"
                    class="pl-2 pr-8 [&>span:first-child]:left-auto [&>span:first-child]:right-2"
                    :model-value="targetDeviceKeys.includes(buildDeviceKey(row))"
                    @select.prevent
                    @update:model-value="(checked: CheckedState) => onTargetDeviceCheckedChange(row, checked)"
                  >
                    <span class="truncate">{{ row.deviceAlias || row.deviceName }}</span>
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Badge v-else :class="headerBadgeClass" variant="outline">
                <span class="max-w-[180px] truncate">
                  {{ selectedDeviceLabel }}
                </span>
              </Badge>
              <Badge :class="headerBadgeClass" variant="outline">{{ $t('orgIotClient.console.productCount', { count: productCount }) }}</Badge>
            </div>
            <DialogDescription>{{ modeDescription }}</DialogDescription>
          </div>
          <div class="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:pr-12">
            <div class="text-muted-foreground col-span-2 text-sm sm:mr-1">{{ $t('orgIotClient.console.changedCount', { count: changedCount }) }}</div>
            <Button size="sm" variant="outline" :disabled="sending || anyRetrying" @click="resetChangedControls">{{ $t('orgIotClient.console.resetChanges') }}</Button>
            <Button size="sm" variant="outline" :disabled="sending" @click="dialogOpen = false">{{ $t('common.cancel') }}</Button>
            <Button
              class="col-span-2 sm:col-span-1"
              size="sm"
              :disabled="sending || controls.length === 0 || (changedCount === 0 && !hasActionItemsToApply) || anyRetrying"
              @click="onApply"
            >
              <Spinner v-if="sending" class="size-4" />
              {{ $t('orgIotClient.console.dispatchControl') }}
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div class="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6">
        <div v-if="schemaError" class="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {{ schemaError }}
        </div>

        <div v-if="loading" class="flex h-64 items-center justify-center">
          <Spinner class="size-6" />
        </div>

        <div
          v-else-if="controls.length === 0"
          class="text-muted-foreground flex h-64 flex-col items-center justify-center rounded-md border border-dashed text-sm"
        >
          {{ $t('orgIotClient.console.noControls') }}
        </div>

        <div v-else class="h-full min-h-0 overflow-y-auto pr-3">
          <div class="space-y-3">
            <div
              v-for="item in orderedControls"
              :key="`${item.schemaType}:${item.id || item.identifier}`"
              :class="[
                'bg-background rounded-md border px-4 py-3 transition-colors',
                isControlChanged(item) ? 'border-primary bg-primary/5 shadow-sm' : 'border-border',
                isActionControl(item) || isEditableProperty(item) ? 'cursor-pointer' : '',
              ]"
              @click="toggleControlItem(item)"
            >
              <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">{{ item.name || item.identifier }}</div>
                  <div class="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span class="font-mono">{{ item.identifier }}</span>
                    <Badge variant="outline">{{ item.schemaType === CONTROL_SCHEMA_TYPE_ACTION ? $t('orgIotClient.console.action') : item.affordance?.define?.type }}</Badge>
                    <Badge v-if="isReadonlyProperty(item)" variant="outline">{{ $t('orgIotClient.console.readonly') }}</Badge>
                    <Badge v-if="isControlChanged(item)" variant="secondary">{{ $t('orgIotClient.console.pendingDispatch') }}</Badge>
                    <span v-if="item.schemaType === CONTROL_SCHEMA_TYPE_PROPERTY && !isGroupControl && item.initialValue !== undefined">{{ $t('orgIotClient.console.currentValue', { value: getDisplayLabel(item) }) }}</span>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <div v-if="failedControlMap[item.identifier] || retryingIdentifiers[item.identifier]" class="flex items-center gap-2" aria-live="polite">
                    <Badge
                      v-if="failedControlMap[item.identifier] && !retryingIdentifiers[item.identifier]"
                      class="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                      variant="outline"
                    >
                      {{ $t('orgIotClient.console.failedCount', { count: failedControlMap[item.identifier]?.count }) }}
                    </Badge>
                    <Button
                      class="h-7 px-2 text-xs"
                      :aria-busy="retryingIdentifiers[item.identifier] ? 'true' : undefined"
                      :disabled="retryingIdentifiers[item.identifier]"
                      size="sm"
                      variant="outline"
                      @click.stop="retryControlItem(item)"
                    >
                      <Spinner v-if="retryingIdentifiers[item.identifier]" class="size-3" />
                      {{ $t('iotApp.cardDetail.retry') }}
                    </Button>
                  </div>
                  <Button
                    v-if="isEditableProperty(item)"
                    :disabled="sending || retryingIdentifiers[item.identifier] || changedValues[item.identifier] === undefined"
                    size="sm"
                    variant="outline"
                    @click.stop="onPropertyExecute(item)"
                  >
                    {{ $t('orgIotClient.console.execute') }}
                  </Button>
                  <Button
                    v-if="isActionControl(item)"
                    :disabled="sending || retryingIdentifiers[item.identifier]"
                    size="sm"
                    variant="outline"
                    @click.stop="onActionExecute(item)"
                  >
                    {{ $t('orgIotClient.console.execute') }}
                  </Button>
                </div>
              </div>

              <div v-if="item.schemaType === CONTROL_SCHEMA_TYPE_ACTION" class="space-y-2" @click.stop>
                <div class="text-xs text-muted-foreground">
                  {{ $t('orgIotClient.console.actionParamsJson') }}
                </div>
                <textarea
                  v-if="item.affordance?.input?.length"
                  class="bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                  :value="getActionInputValue(item)"
                  @click.stop
                  @input="(event) => onActionInputChange(item, String((event.target as HTMLTextAreaElement).value))"
                ></textarea>
                <div v-else class="text-xs text-muted-foreground">{{ $t('orgIotClient.console.noParamsNeeded') }}</div>
              </div>

              <div v-else-if="isReadonlyProperty(item)" class="text-sm text-muted-foreground">
                {{ getDisplayLabel(item) }}
              </div>

              <div v-else-if="item.affordance?.define?.type === 'bool'" class="flex items-center justify-between gap-4" @click.stop>
                <span class="text-muted-foreground text-sm">{{ Number(getDisplayValue(item)) === 1 || getDisplayValue(item) === true ? $t('orgIotClient.console.on') : $t('orgIotClient.console.off') }}</span>
                <Switch
                  :checked="Number(getDisplayValue(item)) === 1 || getDisplayValue(item) === true"
                  @update:checked="(checked: CheckedState) => onBoolChange(item, checked === true)"
                />
              </div>

              <ToggleGroup
                v-else-if="item.affordance?.define?.type === 'enum'"
                :model-value="String(getDisplayValue(item))"
                type="single"
                class="flex-wrap justify-start"
                @click.stop
                @update:model-value="(value) => onEnumChange(item, value)"
              >
                <ToggleGroupItem v-for="option in item.affordance.define.mapping" :key="option.value" :value="String(option.value)" variant="outline">
                  {{ option.label || option.value }}
                </ToggleGroupItem>
              </ToggleGroup>

              <div v-else class="space-y-2" @click.stop>
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="text-muted-foreground">
                    {{ item.affordance?.define?.min }} - {{ item.affordance?.define?.max }}
                    {{ item.affordance?.define?.unit || '' }}
                  </span>
                  <span class="rounded-md border px-2 py-1 font-mono text-xs">
                    {{ getDisplayValue(item) }}
                    {{ item.affordance?.define?.unit || '' }}
                  </span>
                </div>
                <Slider
                  :model-value="[Number(getDisplayValue(item))]"
                  :min="item.affordance?.define?.min"
                  :max="item.affordance?.define?.max"
                  :step="item.affordance?.define?.step"
                  @update:model-value="(value) => onNumberSliderChange(item, value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
