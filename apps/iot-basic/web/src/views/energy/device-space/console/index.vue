<!--
  设备空间控制台：展示区域设备、统计、筛选、列表操作，并通过居中弹窗执行单控/群控。
-->
<script setup lang="ts">
import { $t } from '@vben/locales';
import type { ColumnDef } from '@vben/saas';
import type { DeviceRow } from './modules/device-control-model';

import { computed, h, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreData, ThingsApi } from '@vben/api';
import { Page } from '@vben/common-ui';
import { FlexRender, getCoreRowModel, message, useVueTable } from '@vben/saas';
import { useProjectStore } from '@vben/stores';
import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@unitedrhino/saas-ui/ui/card';
import { Checkbox } from '@unitedrhino/saas-ui/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unitedrhino/saas-ui/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@unitedrhino/saas-ui/ui/dropdown-menu';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unitedrhino/saas-ui/ui/select';
import { Spinner } from '@unitedrhino/saas-ui/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unitedrhino/saas-ui/ui/table';

import EnergyTreeSelector from '#/components/energy/EnergyTreeSelector.vue';
import { useEnergyTree } from '#/hooks/use-energy-tree';
import { buildOrgPath, extractOrgIdFromPath } from '#/router/org-scope';
import { extractList } from '#/utils/api-response';
import { DEVICE_STATUS, DEVICE_STATUS_MAP } from '#/utils/energy-constants';

import DeviceControlDialog from './modules/DeviceControlDialog.vue';
import DeviceTransfer from './modules/DeviceTransfer.vue';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const ALL_AREA_KEY = '__all__';
const PAGE_SIZES = [10, 20, 50];

type CheckedState = boolean | 'indeterminate';
/** DevicePropertyCell 表示设备列表 withProperties 中单个属性的当前值和时间戳。 */
type DevicePropertyCell = { timestamp?: unknown; value?: unknown; dataName?: string };
/** DisplayColumnOption 描述设备列表可由用户切换显示状态的数据列。 */
type DisplayColumnOption = {
  key: string;
  label: string;
  propertyKey?: string;
  type: 'base' | 'property';
};
type DisplayColumnPreference = {
  orderKeys: string[];
  visibleKeys: string[];
};
type DeviceTransferMode = 'scope' | 'selected';
type DeviceTransferScope = {
  areaID?: string;
  areaIDPath?: string;
  groupID?: string;
};

const { groupType, searchValue, treeData, flatData, isLoading: treeLoading, getFilterParams, refresh: refreshTree } = useEnergyTree();

const PROPERTY_COLUMN_PREFIX = 'property:';
const DISPLAY_COLUMN_STORAGE_KEY = 'org-iot-client:device-console:visible-display-columns';
/** BASE_DISPLAY_COLUMNS 定义设备列表固定业务列，选择列和操作列始终保留不参与隐藏。 */
const BASE_DISPLAY_COLUMNS: DisplayColumnOption[] = [
  { key: 'deviceName', label: $t('iotApp.card.deviceId'), type: 'base' },
  { key: 'deviceAlias', label: $t('iotApp.card.deviceName'), type: 'base' },
  { key: 'productName', label: $t('iotApp.productPage.product'), type: 'base' },
  { key: 'status', label: $t('iotApp.cardRoute.colStatus'), type: 'base' },
];
const DEFAULT_DISPLAY_COLUMN_KEYS = BASE_DISPLAY_COLUMNS.map((column) => column.key);

/** readStoredDisplayColumnPreference 读取本地保存的设备列表显示列和排序，异常时回退到默认基础列。 */
function readStoredDisplayColumnPreference(): DisplayColumnPreference {
  if (typeof window === 'undefined') {
    return {
      orderKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
      visibleKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
    };
  }
  try {
    const rawValue = window.localStorage.getItem(DISPLAY_COLUMN_STORAGE_KEY);
    if (!rawValue) {
      return {
        orderKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
        visibleKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
      };
    }
    const parsedValue = JSON.parse(rawValue);
    if (Array.isArray(parsedValue) && parsedValue.every((item) => typeof item === 'string')) {
      return {
        orderKeys: parsedValue.length > 0 ? [...new Set(parsedValue)] : [...DEFAULT_DISPLAY_COLUMN_KEYS],
        visibleKeys: parsedValue.length > 0 ? [...new Set(parsedValue)] : [...DEFAULT_DISPLAY_COLUMN_KEYS],
      };
    }
    if (
      !parsedValue ||
      !Array.isArray(parsedValue.visibleKeys) ||
      !parsedValue.visibleKeys.every((item: unknown) => typeof item === 'string') ||
      !Array.isArray(parsedValue.orderKeys) ||
      !parsedValue.orderKeys.every((item: unknown) => typeof item === 'string')
    ) {
      return {
        orderKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
        visibleKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
      };
    }
    return {
      orderKeys: parsedValue.orderKeys.length > 0 ? [...new Set(parsedValue.orderKeys as string[])] : [...DEFAULT_DISPLAY_COLUMN_KEYS],
      visibleKeys: parsedValue.visibleKeys.length > 0 ? [...new Set(parsedValue.visibleKeys as string[])] : [...DEFAULT_DISPLAY_COLUMN_KEYS],
    };
  } catch {
    return {
      orderKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
      visibleKeys: [...DEFAULT_DISPLAY_COLUMN_KEYS],
    };
  }
}

/** saveDisplayColumnPreference 将用户选择的显示列和排序保存到浏览器本地存储。 */
function saveDisplayColumnPreference(preference: DisplayColumnPreference) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(DISPLAY_COLUMN_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // 本地存储不可用时仅影响偏好保存，不影响当前页操作。
  }
}

/** consoleTreeData 在树数据顶部插入"全部区域"虚拟节点。 */
const consoleTreeData = computed(() => {
  return [
    {
      key: ALL_AREA_KEY,
      label: $t('orgIotClient.console.allAreas'),
      value: ALL_AREA_KEY,
      children: treeData.value as any[],
    },
  ];
});

const selectedKeys = ref<string[]>([]);
const searchDeviceName = ref('');
const searchDeviceAlias = ref('');
const hideGateway = ref(true);
const searchDeviceStatus = ref('all');
const page = ref(1);
const pageSize = ref(20);
const checkedRowKeys = ref<string[]>([]);
const controlDialogOpen = ref(false);
const controlRows = ref<DeviceRow[]>([]);
const mobileAreaDialogOpen = ref(false);
const transferDialogOpen = ref(false);
const transferRows = ref<DeviceRow[]>([]);
const transferMode = ref<DeviceTransferMode>('selected');
const transferScope = ref<DeviceTransferScope>({});
const displayColumnPreference = readStoredDisplayColumnPreference();
/** visibleDisplayColumnKeys 记录当前用户实际选择显示的数据列。 */
const visibleDisplayColumnKeys = ref<string[]>(displayColumnPreference.visibleKeys);
/** displayColumnOrderKeys 记录列显示菜单和设备列表的数据列排序。 */
const displayColumnOrderKeys = ref<string[]>(displayColumnPreference.orderKeys);
/** discoveredPropertyColumnKeys 记录已发现过的属性列，避免刷新列表后重置用户隐藏状态。 */
const discoveredPropertyColumnKeys = ref<string[]>([]);
const draggingDisplayColumnKey = ref('');

watchEffect(() => {
  if (selectedKeys.value.length === 0) {
    selectedKeys.value = [ALL_AREA_KEY];
  }
});

const hasSelection = computed(() => selectedKeys.value.length > 0);

function getDeviceRowKey(row: DeviceRow) {
  return `${row.productID || ''}:${row.deviceName || ''}`;
}

const statsData = ref<any>(null);
const statsRequestSeq = ref(0);

function toQueryFilter(filter: Record<string, unknown>): Record<string, object> {
  return filter as unknown as Record<string, object>;
}

async function fetchStats() {
  if (!hasSelection.value) return;
  const requestSeq = ++statsRequestSeq.value;
  const projectID = projectStore.currentProjectID;
  const selectedAreaKey = selectedKeys.value[0];
  try {
    const filter = selectedAreaKey === ALL_AREA_KEY ? {} : { 'areaID:subChildren': selectedAreaKey };
    const response = await CoreData.postApiV1DataQueryInfoGetList({
      finds: [
        {
          code: 'dmDeviceCount',
          aggregations: [{ argFunc: 'count', column: 'total' }],
          groupBy: 'status',
          columns: 'status',
          filter: toQueryFilter(filter),
        },
      ],
    });
    // 只接受当前项目、当前轮次的最新响应，避免切项目后的旧请求回写错误统计。
    if (requestSeq !== statsRequestSeq.value || projectID !== projectStore.currentProjectID) {
      return;
    }
    statsData.value = response;
  } catch (error) {
    console.error('fetchStats error', error);
  }
}

const deviceStats = computed(() => {
  const result = { total: 0, online: 0, offline: 0, fault: 0 };
  const list = statsData.value?.list?.[0] ?? [];
  for (const item of list) {
    const count = Number(item.total ?? 0);
    result.total += count;
    switch (item.status) {
      case DEVICE_STATUS.FAULT: {
        result.fault = count;
        break;
      }
      case DEVICE_STATUS.OFFLINE: {
        result.offline = count;
        break;
      }
      case DEVICE_STATUS.ONLINE: {
        result.online = count;
        break;
      }
    }
  }
  return result;
});

const statCards = computed(() => [
  {
    label: $t('orgIotClient.dashboard.totalDevices'),
    value: deviceStats.value.total,
    icon: 'icon-[mdi--devices]',
    tone: 'text-sky-600 dark:text-sky-400',
    borderTone: 'border-sky-300/60 dark:border-sky-500/40',
    deviceStatus: undefined,
  },
  {
    label: $t('orgIotClient.dashboard.onlineDevices'),
    value: deviceStats.value.online,
    icon: 'icon-[mdi--check-circle]',
    tone: 'text-emerald-600 dark:text-emerald-400',
    borderTone: 'border-emerald-300/60 dark:border-emerald-500/40',
    deviceStatus: DEVICE_STATUS.ONLINE,
  },
  {
    label: $t('orgIotClient.dashboard.offlineDevices'),
    value: deviceStats.value.offline,
    icon: 'icon-[mdi--cloud-off-outline]',
    tone: 'text-muted-foreground',
    borderTone: 'border-slate-300/60 dark:border-slate-500/40',
    deviceStatus: DEVICE_STATUS.OFFLINE,
  },
  {
    label: $t('orgIotClient.console.statAbnormal'),
    value: deviceStats.value.fault,
    icon: 'icon-[mdi--alert-circle]',
    tone: 'text-red-600 dark:text-red-400',
    borderTone: 'border-red-300/60 dark:border-red-500/40',
    deviceStatus: DEVICE_STATUS.FAULT,
  },
]);

/** deviceStatusFilterOptions 定义查询表单可选的设备状态过滤项。 */
const deviceStatusFilterOptions = [
  { label: $t('orgIotClient.console.all'), value: 'all' },
  // DEVICE_STATUS_MAP 为 Record 索引类型，严格模式要求空值兜底；键来自枚举常量，运行时必然存在
  { label: DEVICE_STATUS_MAP[DEVICE_STATUS.INACTIVE]?.label ?? '', value: String(DEVICE_STATUS.INACTIVE) },
  { label: DEVICE_STATUS_MAP[DEVICE_STATUS.ONLINE]?.label ?? '', value: String(DEVICE_STATUS.ONLINE) },
  { label: DEVICE_STATUS_MAP[DEVICE_STATUS.OFFLINE]?.label ?? '', value: String(DEVICE_STATUS.OFFLINE) },
  { label: DEVICE_STATUS_MAP[DEVICE_STATUS.FAULT]?.label ?? '', value: String(DEVICE_STATUS.FAULT) },
] as const;

const deviceData = ref<any>(null);
const deviceLoading = ref(false);
const deviceRequestSeq = ref(0);

async function fetchDevices() {
  if (!hasSelection.value) return;
  const requestSeq = ++deviceRequestSeq.value;
  const projectID = projectStore.currentProjectID;
  const selectedAreaKeys = [...selectedKeys.value];
  const shouldHideGateway = hideGateway.value;
  const deviceName = searchDeviceName.value;
  const deviceAlias = searchDeviceAlias.value;
  const deviceStatus = searchDeviceStatus.value;
  const currentPage = page.value;
  const currentPageSize = pageSize.value;
  deviceLoading.value = true;
  try {
    const response = await ThingsApi.postApiV1ThingsDeviceInfoGetList({
      page: { page: currentPage, size: currentPageSize },
      ...(deviceName ? { deviceName } : {}),
      ...(deviceAlias ? { deviceAlias } : {}),
      ...(deviceStatus === 'all' ? {} : { status: Number(deviceStatus) }),
      ...(shouldHideGateway ? { deviceTypes: [1, 3] } : {}),
      ...(selectedAreaKeys[0] === ALL_AREA_KEY ? {} : getFilterParams(selectedAreaKeys)),
      withProperties: [],
    } as any);
    // 只接受当前项目、当前轮次的最新响应，避免切项目后的旧请求回写旧列表。
    if (requestSeq !== deviceRequestSeq.value || projectID !== projectStore.currentProjectID) {
      return;
    }
    deviceData.value = response;
  } catch (error) {
    console.error('fetchDevices error', error);
  } finally {
    if (requestSeq === deviceRequestSeq.value) {
      deviceLoading.value = false;
    }
  }
}

const deviceList = computed<DeviceRow[]>(() => extractList(deviceData.value));
const deviceTotal = computed(() => (deviceData.value as any)?.total ?? (deviceData.value as any)?.data?.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(deviceTotal.value / pageSize.value)));
const chooseRows = computed(() => {
  const selected = new Set(checkedRowKeys.value);
  return deviceList.value.filter((row) => selected.has(getDeviceRowKey(row)));
});
const currentPageKeys = computed(() => deviceList.value.map((row) => getDeviceRowKey(row)));
const allCurrentPageSelected = computed(() => currentPageKeys.value.length > 0 && currentPageKeys.value.every((key) => checkedRowKeys.value.includes(key)));
const currentPagePartiallySelected = computed(() => currentPageKeys.value.some((key) => checkedRowKeys.value.includes(key)) && !allCurrentPageSelected.value);
const selectedAreaLabel = computed(() => selectedKeys.value[0] === ALL_AREA_KEY ? $t('orgIotClient.console.allAreas') : $t('orgIotClient.console.selectedArea'));

/** getPropertyDisplayName 读取属性的中文展示名，缺失时回退到属性 key。 */
function getPropertyDisplayName(row: DeviceRow, propertyKey: string) {
  const property = row.withProperties?.[propertyKey] as DevicePropertyCell | undefined;
  const dataName = typeof property?.dataName === 'string' ? property.dataName.trim() : '';
  return dataName || propertyKey;
}

/** propertyDisplayColumns 从当前页设备 withProperties 中提取可显示的动态属性列。 */
const propertyDisplayColumns = computed<DisplayColumnOption[]>(() => {
  const propertyNameMap = new Map<string, string>();
  for (const row of deviceList.value) {
    for (const key of Object.keys(row.withProperties || {})) {
      const displayName = getPropertyDisplayName(row, key);
      const currentName = propertyNameMap.get(key);
      if (currentName && currentName !== key) {
        continue;
      }
      propertyNameMap.set(key, displayName);
    }
  }

  return [...propertyNameMap.entries()]
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, label]) => ({
      key: `${PROPERTY_COLUMN_PREFIX}${key}`,
      label,
      propertyKey: key,
      type: 'property',
    }));
});
const displayColumnOptions = computed<DisplayColumnOption[]>(() => [...BASE_DISPLAY_COLUMNS, ...propertyDisplayColumns.value]);
const orderedDisplayColumnOptions = computed<DisplayColumnOption[]>(() => {
  const optionMap = new Map(displayColumnOptions.value.map((column) => [column.key, column]));
  const orderedColumns = displayColumnOrderKeys.value.map((key) => optionMap.get(key)).filter((column): column is DisplayColumnOption => Boolean(column));
  const orderedKeys = new Set(orderedColumns.map((column) => column.key));
  const appendedColumns = displayColumnOptions.value.filter((column) => !orderedKeys.has(column.key));
  return [...orderedColumns, ...appendedColumns];
});
const visiblePropertyDisplayColumns = computed(() => orderedDisplayColumnOptions.value.filter((column) => column.type === 'property' && isDisplayColumnVisible(column.key)));
const visibleDisplayColumns = computed(() => orderedDisplayColumnOptions.value.filter((column) => isDisplayColumnVisible(column.key)));

watch(
  [visibleDisplayColumnKeys, displayColumnOrderKeys],
  ([visibleKeys, orderKeys]) => {
    saveDisplayColumnPreference({
      orderKeys: [...new Set(orderKeys)],
      visibleKeys: [...new Set(visibleKeys)],
    });
  },
  { deep: true },
);

// 新出现的属性列默认隐藏，只进入列显示菜单；用户选择展示后通过本地存储保留偏好。
watch(propertyDisplayColumns, (columns) => {
  const discoveredKeys = new Set(discoveredPropertyColumnKeys.value);
  for (const column of columns) {
    if (!discoveredKeys.has(column.key)) {
      discoveredKeys.add(column.key);
    }
  }
  discoveredPropertyColumnKeys.value = [...discoveredKeys];
  const allowedKeys = new Set([...BASE_DISPLAY_COLUMNS.map((column) => column.key), ...discoveredKeys]);
  visibleDisplayColumnKeys.value = [...new Set(visibleDisplayColumnKeys.value)].filter((key) => allowedKeys.has(key));
  displayColumnOrderKeys.value = [
    ...displayColumnOrderKeys.value.filter((key) => allowedKeys.has(key)),
    ...displayColumnOptions.value.map((column) => column.key).filter((key) => !displayColumnOrderKeys.value.includes(key)),
  ];
});

function isDisplayColumnVisible(key: string) {
  return visibleDisplayColumnKeys.value.includes(key);
}

/** getVisibleDisplayColumnCount 统计当前仍可见的数据列数量，用于防止列表被切空。 */
function getVisibleDisplayColumnCount(keys = visibleDisplayColumnKeys.value) {
  return displayColumnOptions.value.filter((column) => keys.includes(column.key)).length;
}

/** toggleDisplayColumn 切换基础列或属性列的可见状态。 */
function toggleDisplayColumn(key: string, checked: CheckedState) {
  const next = new Set(visibleDisplayColumnKeys.value);
  if (checked === true) {
    next.add(key);
  } else {
    next.delete(key);
  }
  const nextKeys = [...next];
  if (getVisibleDisplayColumnCount(nextKeys) === 0) {
    message.warning($t('orgIotClient.console.keepOneColumn'));
    return;
  }
  visibleDisplayColumnKeys.value = nextKeys;
}

/** moveDisplayColumn 将一个显示列拖动到另一个显示列的位置并保存排序。 */
function moveDisplayColumn(sourceKey: string, targetKey: string) {
  if (!sourceKey || !targetKey || sourceKey === targetKey) {
    return;
  }
  const orderedKeys = orderedDisplayColumnOptions.value.map((column) => column.key);
  const sourceIndex = orderedKeys.indexOf(sourceKey);
  const targetIndex = orderedKeys.indexOf(targetKey);
  if (sourceIndex < 0 || targetIndex < 0) {
    return;
  }
  const nextKeys = [...orderedKeys];
  const [sourceItem] = nextKeys.splice(sourceIndex, 1);
  if (!sourceItem) {
    return;
  }
  nextKeys.splice(targetIndex, 0, sourceItem);
  displayColumnOrderKeys.value = nextKeys;
}

/** onDisplayColumnDragStart 记录正在拖拽的列 key。 */
function onDisplayColumnDragStart(event: DragEvent, key: string) {
  draggingDisplayColumnKey.value = key;
  event.dataTransfer?.setData('text/plain', key);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

/** onDisplayColumnDrop 完成列显示菜单中的拖拽排序。 */
function onDisplayColumnDrop(event: DragEvent, targetKey: string) {
  event.preventDefault();
  const sourceKey = event.dataTransfer?.getData('text/plain') || draggingDisplayColumnKey.value;
  moveDisplayColumn(sourceKey, targetKey);
  draggingDisplayColumnKey.value = '';
}

function formatPropertyValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

/** getPropertyDisplayValue 从设备 withProperties 中取出指定属性的展示值。 */
function getPropertyDisplayValue(row: DeviceRow, propertyKey?: string) {
  if (!propertyKey) return '-';
  const property = row.withProperties?.[propertyKey] as DevicePropertyCell | undefined;
  return formatPropertyValue(property?.value);
}

function toggleRowSelection(row: DeviceRow, checked: boolean) {
  const rowKey = getDeviceRowKey(row);
  const next = new Set(checkedRowKeys.value);
  if (checked) {
    next.add(rowKey);
  } else {
    next.delete(rowKey);
  }
  checkedRowKeys.value = [...next];
}

function toggleCurrentPageSelection(checked: boolean) {
  const next = new Set(checkedRowKeys.value);
  for (const key of currentPageKeys.value) {
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
  }
  checkedRowKeys.value = [...next];
}

function toggleHideGateway(checked: CheckedState) {
  hideGateway.value = checked === true;
}

function statusTone(status: unknown) {
  switch (Number(status)) {
    case DEVICE_STATUS.ONLINE: {
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    }
    case DEVICE_STATUS.FAULT: {
      return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400';
    }
    case DEVICE_STATUS.OFFLINE: {
      return 'border-border/60 bg-muted text-muted-foreground';
    }
    default: {
      return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }
  }
}

/** createDisplayColumnDef 将用户可排序的数据列转换成 TanStack 表格列定义。 */
function createDisplayColumnDef(column: DisplayColumnOption): ColumnDef<DeviceRow> {
  if (column.type === 'property') {
    return {
      id: column.key,
      header: () => h('span', column.label),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs text-muted-foreground' }, getPropertyDisplayValue(row.original, column.propertyKey)),
    } satisfies ColumnDef<DeviceRow>;
  }

  switch (column.key) {
    case 'deviceName': {
      return {
        accessorKey: 'deviceName',
        header: () => h('span', $t('iotApp.card.deviceId')),
        cell: ({ row }) =>
          h(
            Button,
            {
              class: 'h-auto max-w-[220px] justify-start truncate p-0 font-mono text-xs',
              variant: 'link',
              onClick: () => openControlForRows([row.original]),
            },
            () => row.original.deviceName || '-',
          ),
      } satisfies ColumnDef<DeviceRow>;
    }
    case 'deviceAlias': {
      return {
        accessorKey: 'deviceAlias',
        header: () => h('span', $t('iotApp.card.deviceName')),
        cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.deviceAlias || '-'),
      } satisfies ColumnDef<DeviceRow>;
    }
    case 'productName': {
      return {
        accessorKey: 'productName',
        header: () => h('span', $t('iotApp.productPage.product')),
        cell: ({ row }) => h('span', { class: 'text-sm text-muted-foreground' }, row.original.productName || row.original.productID || '-'),
      } satisfies ColumnDef<DeviceRow>;
    }
    case 'status': {
      return {
        accessorKey: 'status',
        header: () => h('span', $t('iotApp.cardRoute.colStatus')),
        cell: ({ row }) => {
          const statusKey = Number(row.original.status);
          const status = DEVICE_STATUS_MAP[statusKey] ?? { label: $t('orgIotClient.deviceSpace.unknown') };
          return h(Badge, { class: statusTone(row.original.status), variant: 'outline' }, () => status.label);
        },
      } satisfies ColumnDef<DeviceRow>;
    }
    default: {
      return {
        id: column.key,
        header: () => h('span', column.label),
        cell: () => h('span', { class: 'text-muted-foreground text-sm' }, '-'),
      } satisfies ColumnDef<DeviceRow>;
    }
  }
}

const columns = computed<ColumnDef<DeviceRow>[]>(() => [
  {
    id: 'select',
    header: () =>
      h(Checkbox, {
        modelValue: currentPagePartiallySelected.value ? 'indeterminate' : allCurrentPageSelected.value,
        disabled: deviceList.value.length === 0,
        'aria-label': $t('orgIotClient.console.selectAllDevices'),
        'onUpdate:modelValue': (checked: CheckedState) => toggleCurrentPageSelection(checked === true),
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        modelValue: checkedRowKeys.value.includes(getDeviceRowKey(row.original)),
        'aria-label': $t('orgIotClient.console.selectDevice'),
        'onUpdate:modelValue': (checked: CheckedState) => toggleRowSelection(row.original, checked === true),
      }),
  },
  ...visibleDisplayColumns.value.map((column) => createDisplayColumnDef(column)),
  {
    id: 'actions',
    header: () => h('span', $t('iotApp.card.actions')),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(
          Button,
          {
            class: 'h-7 px-2',
            size: 'sm',
            variant: 'ghost',
            onClick: () => openDeviceInfoDashboard(row.original),
          },
          () => $t('orgIotClient.console.dashboardBtn'),
        ),
        h(
          Button,
          {
            class: 'h-7 px-2',
            size: 'sm',
            variant: 'ghost',
            onClick: () => openDeviceLogs(row.original),
          },
          () => $t('orgIotClient.console.logsBtn'),
        ),
      ]),
  },
]);

const table = useVueTable({
  get data() {
    return deviceList.value;
  },
  get columns() {
    return columns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
});

/** openControlForRows 统一打开单设备或多设备控制弹窗。 */
function openControlForRows(rows: DeviceRow[]) {
  if (rows.length === 0) {
    message.warning($t('orgIotClient.deviceSpace.selectDevicesFirst'));
    return;
  }
  controlRows.value = rows.length > 1 ? [...deviceList.value] : [...rows];
  controlDialogOpen.value = true;
}

/** syncControlSelectedKeys 将控制弹窗内的设备重选同步回设备列表勾选状态。 */
function syncControlSelectedKeys(keys: string[]) {
  checkedRowKeys.value = [...keys];
}

/** openDeviceInfoDashboard 打开当前组织作用域下的单设备属性看板页。 */
function openDeviceInfoDashboard(row: DeviceRow) {
  if (!row?.productID || !row?.deviceName) {
    message.warning($t('orgIotClient.console.boardInfoMissing'));
    return;
  }

  const targetPath = `/device-space/device-info/${encodeURIComponent(row.productID)}/${encodeURIComponent(row.deviceName)}?tab=attrs`;
  router.push(buildOrgPath(extractOrgIdFromPath(route.path), targetPath));
}

/** openDeviceLogs 打开当前组织作用域下的单设备日志聚合页。 */
function openDeviceLogs(row: DeviceRow) {
  if (!row?.productID || !row?.deviceName) {
    message.warning($t('orgIotClient.console.logsInfoMissing'));
    return;
  }

  const targetPath = `/device-space/device-logs/${encodeURIComponent(row.productID)}/${encodeURIComponent(row.deviceName)}`;
  router.push(buildOrgPath(extractOrgIdFromPath(route.path), targetPath));
}

function refresh() {
  checkedRowKeys.value = [];
  page.value = 1;
  fetchDevices();
  fetchStats();
}

function onSearch() {
  checkedRowKeys.value = [];
  page.value = 1;
  fetchDevices();
}

function onReset() {
  searchDeviceName.value = '';
  searchDeviceAlias.value = '';
  searchDeviceStatus.value = 'all';
  hideGateway.value = true;
  checkedRowKeys.value = [];
  page.value = 1;
  fetchDevices();
}

/** onStatCardClick 按统计卡片点击的状态发起设备列表过滤查询。 */
function onStatCardClick(deviceStatus?: number) {
  searchDeviceStatus.value = deviceStatus ? String(deviceStatus) : 'all';
  checkedRowKeys.value = [];
  page.value = 1;
  fetchDevices();
}

/** isStatCardActive 判断当前统计卡片是否与查询状态一致，用于显示选中态。 */
function isStatCardActive(deviceStatus?: number) {
  return deviceStatus ? searchDeviceStatus.value === String(deviceStatus) : searchDeviceStatus.value === 'all';
}

function getStatCardActiveBorderClass(deviceStatus?: number) {
  if (!isStatCardActive(deviceStatus)) {
    return '';
  }
  if (deviceStatus === DEVICE_STATUS.ONLINE) {
    return 'border-emerald-500 dark:border-emerald-300';
  }
  if (deviceStatus === DEVICE_STATUS.OFFLINE) {
    return 'border-zinc-500 dark:border-zinc-200';
  }
  if (deviceStatus === DEVICE_STATUS.FAULT) {
    return 'border-red-500 dark:border-red-300';
  }
  return 'border-sky-500 dark:border-sky-300';
}

function handlePageChange(nextPage: number) {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value);
}

function handlePageSizeChange(nextPageSize: number) {
  pageSize.value = nextPageSize;
  page.value = 1;
}

/** buildTransferScope 根据当前设备树选中范围生成后端全选字段。 */
function buildTransferScope(): DeviceTransferScope {
  const selectedKey = selectedKeys.value[0];
  if (!selectedKey || selectedKey === ALL_AREA_KEY) {
    return {};
  }
  if (groupType.value === 'groupBuildingIDs') {
    return { groupID: selectedKey };
  }
  const selectedNode = flatData.value.find((node) => node.key === selectedKey);
  return selectedNode?.idPath ? { areaIDPath: selectedNode.idPath } : { areaID: selectedKey };
}

/** onTransferSelectedDevices 打开已勾选设备的区域转移弹窗。 */
function onTransferSelectedDevices() {
  if (chooseRows.value.length === 0) {
    message.warning($t('orgIotClient.deviceSpace.selectDevicesFirst'));
    return;
  }
  transferMode.value = 'selected';
  transferScope.value = {};
  transferRows.value = chooseRows.value;
  transferDialogOpen.value = true;
}

/** onTransferAllDevices 打开当前范围全部设备的区域转移弹窗。 */
function onTransferAllDevices() {
  if (deviceTotal.value === 0) {
    message.warning($t('orgIotClient.console.noTransferable'));
    return;
  }
  transferMode.value = 'scope';
  transferScope.value = buildTransferScope();
  transferRows.value = [];
  transferDialogOpen.value = true;
}

watch(
  [selectedKeys, groupType],
  () => {
    checkedRowKeys.value = [];
    fetchStats();
    fetchDevices();
  },
  { immediate: true },
);

watch([page, pageSize], () => {
  checkedRowKeys.value = [];
  fetchDevices();
});

watch(
  () => projectStore.currentProjectID,
  async (projectID, previousProjectID) => {
    if (!projectID || projectID === previousProjectID) {
      return;
    }
    // 项目切换后，区域树、统计卡片和设备列表都必须基于新项目重新拉取。
    statsRequestSeq.value += 1;
    deviceRequestSeq.value += 1;
    statsData.value = null;
    deviceData.value = null;
    selectedKeys.value = [];
    checkedRowKeys.value = [];
    page.value = 1;
    await refreshTree();
    fetchStats();
    fetchDevices();
  },
);
</script>

<template>
  <Page>
    <div class="flex h-full min-w-0 gap-3">
      <Card class="hidden lg:block h-full w-60 shrink-0 overflow-hidden">
        <CardContent class="flex h-full flex-col p-3">
          <EnergyTreeSelector
            :selected-keys="selectedKeys"
            :group-type="groupType"
            :tree-data="consoleTreeData as any"
            :loading="treeLoading"
            :search-value="searchValue"
            :multiple="false"
            :show-group-type="false"
            @update:selected-keys="(value) => (selectedKeys = value)"
            @update:group-type="(value) => (groupType = value)"
            @update:search-value="(value) => (searchValue = value)"
          />
        </CardContent>
      </Card>

      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <Button
          data-testid="device-console-mobile-area-trigger"
          class="lg:hidden h-10 w-full justify-between"
          type="button"
          variant="outline"
          @click="mobileAreaDialogOpen = true"
        >
          <span class="flex min-w-0 items-center gap-2">
            <span class="icon-[mdi--map-marker-radius-outline] size-4 shrink-0"></span>
            <span class="truncate">{{ selectedAreaLabel }}</span>
          </span>
          <span class="icon-[mdi--chevron-down] size-4 shrink-0"></span>
        </Button>

          <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Card
                v-for="item in statCards"
                :key="item.label"
                class="cursor-pointer transition"
            :class="[item.borderTone, getStatCardActiveBorderClass(item.deviceStatus), isStatCardActive(item.deviceStatus) ? 'border-2 shadow-md' : 'shadow-sm']"
                role="button"
                tabindex="0"
                @click="onStatCardClick(item.deviceStatus)"
              >
            <CardContent class="flex items-center justify-between p-3 sm:p-4">
              <div>
                <div class="text-muted-foreground text-xs">{{ item.label }}</div>
                <div class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{{ item.value }}</div>
              </div>
              <span :class="[item.icon, 'size-6 sm:size-7', item.tone]"></span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent class="grid gap-3 p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
            <Input v-model="searchDeviceName" class="h-9 w-full lg:w-[180px]" :placeholder="$t('iotApp.card.deviceId')" />
            <Input v-model="searchDeviceAlias" class="h-9 w-full lg:w-[180px]" :placeholder="$t('iotApp.card.deviceName')" />
            <label class="text-muted-foreground text-sm whitespace-nowrap">{{ $t('orgIotClient.console.deviceStatusLabel') }}</label>
            <Select v-model="searchDeviceStatus">
              <SelectTrigger class="h-9 w-full lg:w-[180px]">
                <SelectValue :placeholder="$t('orgIotClient.console.all')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in deviceStatusFilterOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <label class="text-muted-foreground flex h-9 items-center gap-2 text-sm">
              <Checkbox :checked="hideGateway" @update:checked="toggleHideGateway" />
              {{ $t('orgIotClient.console.filterGateway') }}
            </label>
            <Button class="h-9 gap-1.5" type="button" @click="onSearch">
              <span class="icon-[mdi--magnify] size-4"></span>
              {{ $t('orgManage.common.search') }}
            </Button>
            <Button class="h-9 gap-1.5" type="button" variant="outline" @click="onReset">
              <span class="icon-[mdi--refresh] size-4"></span>
              {{ $t('orgIotClient.console.reset') }}
            </Button>
          </CardContent>
        </Card>

        <Card class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader class="flex-row flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <CardTitle class="text-base">{{ $t('orgIotClient.console.deviceList') }}</CardTitle>
              <div class="text-muted-foreground mt-1 text-xs">{{ $t('orgIotClient.console.deviceCountTotal', { count: deviceTotal }) }}</div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button class="h-8 gap-1.5" size="sm" type="button" variant="outline">
                    <span class="icon-[mdi--view-column-outline] size-4"></span>
                    {{ $t('orgIotClient.console.columnDisplay') }}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="max-h-[min(70vh,360px)] w-[180px] overflow-y-auto">
                  <DropdownMenuLabel>{{ $t('orgIotClient.console.visibleColumns') }}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div
                    v-for="column in orderedDisplayColumnOptions"
                    :key="column.key"
                    :data-testid="`device-console-column-option-${column.key}`"
                    class="flex cursor-grab items-center gap-1 rounded-sm active:cursor-grabbing"
                    draggable="true"
                    @dragstart="(event) => onDisplayColumnDragStart(event, column.key)"
                    @dragover.prevent
                    @drop="(event) => onDisplayColumnDrop(event, column.key)"
                  >
                    <span class="icon-[mdi--drag-vertical] text-muted-foreground ml-1 size-4 shrink-0"></span>
                    <DropdownMenuCheckboxItem
                      class="min-w-0 flex-1 pl-7"
                      :model-value="isDisplayColumnVisible(column.key)"
                      @select.prevent
                      @update:model-value="(checked: CheckedState) => toggleDisplayColumn(column.key, checked)"
                    >
                      <span class="truncate">{{ column.label }}</span>
                    </DropdownMenuCheckboxItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <template v-if="checkedRowKeys.length > 0">
                <Badge variant="secondary">{{ $t('orgIotClient.console.selectedCount', { count: checkedRowKeys.length }) }}</Badge>
                <Button class="h-8 gap-1.5" size="sm" type="button" @click="openControlForRows(chooseRows)">
                  <span class="icon-[mdi--tune-variant] size-4"></span>
                  {{ $t('orgIotClient.console.control') }}
                </Button>
                <div class="inline-flex items-center">
                  <Button class="h-8 gap-1.5 rounded-r-none" size="sm" type="button" variant="outline" @click="onTransferSelectedDevices">
                    <span class="icon-[mdi--map-marker-radius-outline] size-4"></span>
                    {{ $t('orgIotClient.console.transferArea') }}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button
                        :aria-label="$t('orgIotClient.console.moreTransferOps')"
                        class="h-8 w-8 rounded-l-none border-l-0 px-0"
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <span class="icon-[lucide--more-horizontal] size-4"></span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-[190px]">
                      <DropdownMenuItem @click="onTransferAllDevices">{{ $t('orgIotClient.console.transferAllToArea') }}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </template>
            </div>
          </CardHeader>

          <div data-testid="device-console-desktop-table" class="hidden lg:block relative min-h-0 flex-1 overflow-auto">
            <Table :table="table">
              <TableHeader class="bg-background sticky top-0 z-10">
                <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                  <TableHead v-for="header in headerGroup.headers" :key="header.id" class="h-10 whitespace-nowrap">
                    <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="deviceLoading">
                  <TableCell :colspan="columns.length" class="h-64 text-center">
                    <div class="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                      <Spinner class="size-5" />
                      {{ $t('orgIotClient.console.loadingDevices') }}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="table.getRowModel().rows.length === 0">
                  <TableCell :colspan="columns.length" class="text-muted-foreground h-64 text-center text-sm">{{ $t('orgIotClient.console.noDevices') }}</TableCell>
                </TableRow>
                <TableRow v-for="row in table.getRowModel().rows" v-else :key="row.id">
                  <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="whitespace-nowrap">
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div data-testid="device-console-mobile-card-list" class="lg:hidden min-h-0 flex-1 overflow-auto p-3">
            <div v-if="deviceLoading" class="text-muted-foreground flex h-48 items-center justify-center gap-2 text-sm">
              <Spinner class="size-5" />
              {{ $t('orgIotClient.console.loadingDevices') }}
            </div>

            <div v-else-if="deviceList.length === 0" class="text-muted-foreground flex h-48 items-center justify-center rounded-md border border-dashed text-sm">
              {{ $t('orgIotClient.console.noDevices') }}
            </div>

            <div v-else class="space-y-3">
              <div v-for="row in deviceList" :key="getDeviceRowKey(row)" class="rounded-md border bg-background p-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex min-w-0 items-center gap-2">
                      <div class="truncate text-sm font-medium">{{ row.deviceAlias || '-' }}</div>
                      <Badge :class="statusTone(row.status)" variant="outline">
                        {{ (DEVICE_STATUS_MAP[Number(row.status)] ?? { label: $t('orgIotClient.deviceSpace.unknown') }).label }}
                      </Badge>
                    </div>
                    <div class="text-muted-foreground mt-1 truncate font-mono text-xs">{{ row.deviceName || '-' }}</div>
                    <div class="text-muted-foreground mt-1 truncate text-xs">{{ row.productName || row.productID || '-' }}</div>
                  </div>
                  <Button
                    data-testid="device-console-mobile-card-select"
                    class="shrink-0"
                    size="icon-sm"
                    type="button"
                    variant="outline"
                    :aria-label="checkedRowKeys.includes(getDeviceRowKey(row)) ? $t('orgIotClient.console.unselectDevice') : $t('orgIotClient.console.selectDevice')"
                    @click="toggleRowSelection(row, !checkedRowKeys.includes(getDeviceRowKey(row)))"
                  >
                    <span v-if="checkedRowKeys.includes(getDeviceRowKey(row))" class="icon-[mdi--check] size-4"></span>
                    <span v-else class="icon-[mdi--plus] size-4"></span>
                  </Button>
                </div>

                <div class="mt-3 grid grid-cols-3 gap-2">
                  <Button data-testid="device-console-mobile-card-control" class="h-8" size="sm" type="button" @click="openControlForRows([row])">
                    {{ $t('orgIotClient.console.control') }}
                  </Button>
                  <Button class="h-8" size="sm" type="button" variant="outline" @click="openDeviceInfoDashboard(row)">{{ $t('orgIotClient.console.dashboardBtn') }}</Button>
                  <Button class="h-8" size="sm" type="button" variant="outline" @click="openDeviceLogs(row)">{{ $t('orgIotClient.console.logsBtn') }}</Button>
                </div>

                <div v-if="visiblePropertyDisplayColumns.length > 0" class="mt-3 grid grid-cols-2 gap-2">
                  <div v-for="column in visiblePropertyDisplayColumns" :key="column.key" class="min-w-0 rounded-md bg-muted/50 px-2 py-1.5">
                    <div class="text-muted-foreground truncate text-[11px]">{{ column.label }}</div>
                    <div class="mt-0.5 truncate font-mono text-xs">{{ getPropertyDisplayValue(row, column.propertyKey) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <div>{{ $t('iotApp.cardDetail.pageIndicator', { page, total: totalPages }) }}</div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex items-center gap-1">
                <Button
                  v-for="size in PAGE_SIZES"
                  :key="size"
                  class="h-8 px-2"
                  :variant="pageSize === size ? 'default' : 'outline'"
                  size="sm"
                  @click="handlePageSizeChange(size)"
                >
                  {{ size }}
                </Button>
              </div>
              <Button class="h-8" size="sm" variant="outline" :disabled="page <= 1" @click="handlePageChange(page - 1)">{{ $t('console.common.prevPage') }}</Button>
              <Button class="h-8" size="sm" variant="outline" :disabled="page >= totalPages" @click="handlePageChange(page + 1)">{{ $t('console.common.nextPage') }}</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <DeviceControlDialog
      v-model:open="controlDialogOpen"
      :rows="controlRows"
      :project-id="projectStore.currentProjectID"
      :selected-keys="checkedRowKeys"
      @refresh="refresh"
      @update:selected-keys="syncControlSelectedKeys"
    />
    <DeviceTransfer
      v-model:open="transferDialogOpen"
      :rows="transferRows"
      :area-id="selectedKeys[0]"
      :mode="transferMode"
      :scope="transferScope"
      @success="refresh"
    />

    <Dialog v-model:open="mobileAreaDialogOpen">
      <DialogContent class="flex max-h-[86vh] w-[calc(100vw-24px)] flex-col gap-0 p-0">
        <DialogHeader class="border-b px-5 py-4">
          <DialogTitle>{{ $t('orgIotClient.console.selectAreaTitle') }}</DialogTitle>
          <DialogDescription>{{ $t('orgIotClient.console.selectAreaDesc') }}</DialogDescription>
        </DialogHeader>
        <div class="min-h-0 flex-1 px-5 py-4">
          <div class="h-[min(56vh,460px)] rounded-md border p-3">
            <EnergyTreeSelector
              :selected-keys="selectedKeys"
              :group-type="groupType"
              :tree-data="consoleTreeData as any"
              :loading="treeLoading"
              :search-value="searchValue"
              :multiple="false"
              :show-group-type="false"
              @update:selected-keys="(value) => (selectedKeys = value)"
              @update:group-type="(value) => (groupType = value)"
              @update:search-value="(value) => (searchValue = value)"
            />
          </div>
        </div>
        <DialogFooter class="border-t px-5 py-4">
          <Button class="w-full" type="button" @click="mobileAreaDialogOpen = false">{{ $t('orgIotClient.auth.finish') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
</template>
