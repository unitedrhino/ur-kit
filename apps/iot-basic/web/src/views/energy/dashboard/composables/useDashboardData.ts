import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { $t } from '@vben/locales';
import { CoreData, ThingsApi } from '@vben/api';
import { useProjectStore } from '@vben/stores';
import dayjs from 'dayjs';
import { ENERGY_PRODUCT_CATEGORY_CODE, DATA_IDS } from '#/utils/energy-constants';
import type { TreeSelectOption } from 'naive-ui';
import type { DashboardTheme } from './useTheme';

export type EnergyTimeUnit = 'hour' | 'day' | 'month' | 'year';
export type PowerTimeRange = 'today' | 'yesterday' | 'week';

export function getEnergyTimeParams(unit: EnergyTimeUnit) {
  const now = dayjs();
  switch (unit) {
    case 'hour':
      return {
        intervalUnit: 'h',
        timeStart: now.startOf('day').valueOf().toString(),
        timeEnd: now.add(1, 'day').startOf('day').valueOf().toString(),
        format: 'HH:mm',
      };
    case 'day':
      return {
        intervalUnit: 'd',
        timeStart: now.startOf('month').valueOf().toString(),
        timeEnd: now.add(1, 'month').startOf('month').valueOf().toString(),
        format: $t('orgIotClient.energyDashboard.dayFormat', { d: 'D' }),
      };
    case 'month':
      return {
        intervalUnit: 'n',
        timeStart: now.startOf('year').valueOf().toString(),
        timeEnd: now.add(1, 'year').startOf('year').valueOf().toString(),
        format: $t('orgIotClient.energyDashboard.monthFormat', { m: 'M' }),
      };
    case 'year':
      return {
        intervalUnit: 'y',
        timeStart: now.subtract(4, 'year').startOf('year').valueOf().toString(),
        timeEnd: now.add(1, 'year').startOf('year').valueOf().toString(),
        format: $t('orgIotClient.energyDashboard.yearFormat', { y: 'YYYY' }),
      };
  }
}

export function getPowerTimeParams(range: PowerTimeRange) {
  const now = dayjs();
  switch (range) {
    case 'today':
      return {
        intervalUnit: 'h',
        timeStart: now.startOf('day').valueOf().toString(),
        timeEnd: now.endOf('day').valueOf().toString(),
        format: 'HH:mm',
      };
    case 'yesterday':
      return {
        intervalUnit: 'h',
        timeStart: now.subtract(1, 'day').startOf('day').valueOf().toString(),
        timeEnd: now.subtract(1, 'day').endOf('day').valueOf().toString(),
        format: 'HH:mm',
      };
    case 'week':
      return {
        intervalUnit: 'd',
        timeStart: now.subtract(6, 'day').startOf('day').valueOf().toString(),
        timeEnd: now.add(1, 'day').startOf('day').valueOf().toString(),
        format: 'M/D',
      };
  }
}

export function filterByRequestedAreaIDs<T extends { areaID?: string | number }>(list: T[], areaIDs: string[]) {
  if (!Array.isArray(list) || list.length === 0 || areaIDs.length === 0) return list;
  const areaSet = new Set(areaIDs.map(String));
  return list.filter((item) => {
    const id = item?.areaID;
    if (id === undefined || id === null || id === '') return true;
    return areaSet.has(String(id));
  });
}

export function filterPropertyLogResponseByAreaIDs<T extends { list?: Array<{ areaID?: string | number }> }>(
  resp: T | null,
  areaIDs: string[],
): T | null {
  if (!resp || !Array.isArray(resp.list)) return resp;
  return {
    ...resp,
    list: filterByRequestedAreaIDs(resp.list, areaIDs),
  };
}

export function useDashboardData(theme: Ref<DashboardTheme>) {
  const areaIDs = ref<string[]>([]);
  const areaNames = ref<{ areaID: string; areaName: string }[]>([]);
  const areaRawList = ref<any[]>([]);

  /** 当前选中的区域 key（null = 全部区域） */
  const selectedAreaKey = ref<string | null>(null);

  const areaLoading = ref(false);
  const todayEnergyRaw = ref<any>(null);
  const areaEnergyData = ref<any>(null);

  // 用电量分析（可切换时间粒度）
  const energyTimeUnit = ref<EnergyTimeUnit>('day');
  const energyChartRaw = ref<any>(null);

  // 功率趋势（可切换时间范围）
  const powerTimeRange = ref<PowerTimeRange>('today');
  const powerChartRaw = ref<any>(null);

  // 设备统计数据
  const deviceStatsData = ref<any>(null);
  // 告警记录
  const alarmRecords = ref<any[]>([]);

  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  /** 将扁平区域列表构建为树（NTreeSelect 用） */
  const areaTreeOptions = computed<TreeSelectOption[]>(() => {
    const list = areaRawList.value;
    if (!list.length) return [];
    const map: Record<string, TreeSelectOption & { children: TreeSelectOption[] }> = {};
    const roots: TreeSelectOption[] = [];
    for (const item of list) {
      map[item.areaID] = {
        key: item.areaID,
        label: item.areaName ?? '',
        value: item.areaID,
        children: [],
      };
    }
    for (const item of list) {
      const node = map[item.areaID]!;
      if (item.parentAreaID && map[item.parentAreaID]) {
        map[item.parentAreaID]!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    // 移除空 children（叶子节点不显示展开箭头）
    function trimLeaves(nodes: TreeSelectOption[]) {
      for (const n of nodes) {
        const children = (n as any).children as TreeSelectOption[];
        if (children && children.length > 0) {
          trimLeaves(children);
        } else {
          delete (n as any).children;
        }
      }
    }
    trimLeaves(roots);
    return roots;
  });

  /** 递归收集某节点及其所有后代的 ID */
  function collectDescendantIDs(nodeKey: string): string[] {
    const list = areaRawList.value;
    const ids = [nodeKey];
    const childMap = new Map<string, string[]>();
    for (const item of list) {
      if (item.parentAreaID) {
        const arr = childMap.get(item.parentAreaID) ?? [];
        arr.push(item.areaID);
        childMap.set(item.parentAreaID, arr);
      }
    }
    const queue = [nodeKey];
    while (queue.length > 0) {
      const cur = queue.pop()!;
      const children = childMap.get(cur) ?? [];
      for (const c of children) {
        ids.push(c);
        queue.push(c);
      }
    }
    return ids;
  }

  /** 根据选中区域计算实际请求用的 areaIDs */
  const effectiveAreaIDs = computed(() => {
    if (!selectedAreaKey.value) return areaIDs.value;
    return collectDescendantIDs(selectedAreaKey.value);
  });

  async function loadDashboard() {
    areaLoading.value = true;
    try {
      // 获取所有区域（包含所有层级，含末端节点）
      const res = await ThingsApi.postApiV1ThingsAreaInfoGetList({} as any);
      const list = (res as any)?.list ?? [];
      areaRawList.value = list;
      areaNames.value = list.map((i: any) => ({
        areaID: i.areaID,
        areaName: i.areaName,
      }));
      areaIDs.value = list.map((i: any) => i.areaID);

      if (areaIDs.value.length === 0) return;

      await fetchData();
    } catch (e) {
      console.error('加载仪表盘数据失败:', e);
    } finally {
      areaLoading.value = false;
    }
  }

  // --- 可独立刷新的子图表 ---
  /** 构建基础过滤参数（含 areaIDs + partitionBy） */
  function buildFilterParams() {
    const ids = effectiveAreaIDs.value;
    return ids.length > 0 ? { areaIDs: ids, partitionBy: 'areaID' } : {};
  }

  async function fetchEnergyChart(unit: EnergyTimeUnit) {
    const p = getEnergyTimeParams(unit);
    const ids = effectiveAreaIDs.value;
    const res = await ThingsApi.postApiV1ThingsDeviceMsgPropertyLogGetList({
      productCategoryCode: ENERGY_PRODUCT_CATEGORY_CODE,
      ...buildFilterParams(),
      dataID: DATA_IDS.TOTAL_ENERGY_CHANGE,
      interval: 1,
      intervalUnit: p.intervalUnit,
      argFunc: 'sum',
      timeStart: p.timeStart,
      timeEnd: p.timeEnd,
      fill: 'LINEAR',
    } as any).catch(() => null);
    energyChartRaw.value = {
      data: filterPropertyLogResponseByAreaIDs(res as any, ids),
      format: p.format,
      intervalUnit: p.intervalUnit,
    };
  }

  async function fetchPowerChart(range: PowerTimeRange) {
    const p = getPowerTimeParams(range);
    const ids = effectiveAreaIDs.value;
    const res = await ThingsApi.postApiV1ThingsDeviceMsgPropertyLogGetList({
      productCategoryCode: ENERGY_PRODUCT_CATEGORY_CODE,
      ...buildFilterParams(),
      dataID: DATA_IDS.P,
      interval: 1,
      intervalUnit: p.intervalUnit,
      argFunc: 'avg',
      timeStart: p.timeStart,
      timeEnd: p.timeEnd,
      fill: 'LINEAR',
    } as any).catch(() => null);
    powerChartRaw.value = {
      data: filterPropertyLogResponseByAreaIDs(res as any, ids),
      format: p.format,
      intervalUnit: p.intervalUnit,
    };
  }

  function setEnergyTimeUnit(unit: EnergyTimeUnit) {
    energyTimeUnit.value = unit;
    if (effectiveAreaIDs.value.length > 0) fetchEnergyChart(unit);
  }

  function setPowerTimeRange(range: PowerTimeRange) {
    powerTimeRange.value = range;
    if (effectiveAreaIDs.value.length > 0) fetchPowerChart(range);
  }

  /** 切换选中区域并刷新数据 */
  function setSelectedArea(key: string | null) {
    selectedAreaKey.value = key;
    if (areaIDs.value.length > 0) fetchData();
  }

  // --- 主数据加载 ---
  async function fetchData() {
    const ids = effectiveAreaIDs.value;
    const fp = buildFilterParams();
    const base = { productCategoryCode: ENERGY_PRODUCT_CATEGORY_CODE, ...fp };
    const todayStart = dayjs().startOf('day').valueOf().toString();
    const tmrStart = dayjs().add(1, 'day').startOf('day').valueOf().toString();

    const results = await Promise.allSettled([
      // 0: Today energy (日粒度 sum — batch 的 sum 不可用，改为独立请求)
      ThingsApi.postApiV1ThingsDeviceMsgPropertyLogGetList({
        ...base,
        dataID: DATA_IDS.TOTAL_ENERGY_CHANGE,
        interval: 1,
        intervalUnit: 'd',
        argFunc: 'sum',
        timeStart: todayStart,
        timeEnd: tmrStart,
      } as any),
      // 1: Energy chart (switchable)
      fetchEnergyChart(energyTimeUnit.value),
      // 2: Power chart (switchable) — powerStats 从这里派生
      fetchPowerChart(powerTimeRange.value),
      // 3: Area energy — Agg API with partitionBy
      ThingsApi.postApiV1ThingsDeviceMsgPropertyLogAggGetList({
        areaIDs: ids,
        interval: 1,
        intervalUnit: 'n',
        productCategoryCode: ENERGY_PRODUCT_CATEGORY_CODE,
        partitionBy: 'areaID',
        timeStart: dayjs().startOf('month').valueOf().toString(),
        timeEnd: dayjs().endOf('month').valueOf().toString(),
        aggs: [
          { dataID: DATA_IDS.TOTAL_ENERGY_CHANGE, argFuncs: ['sum'], noFirstTs: true },
        ],
      } as any),
      // 4: Device stats
      CoreData.postApiV1DataQueryInfoGetList({
        finds: [
          {
            code: 'dmDeviceCount',
            aggregations: [{ argFunc: 'count', column: 'total' }],
            groupBy: 'isOnline',
            columns: 'isOnline',
          },
          {
            code: 'dmDeviceCount',
            aggregations: [{ argFunc: 'count', column: 'total' }],
            groupBy: 'status',
            columns: 'status',
          },
        ],
      }),
      // 5: Alarm records
      ThingsApi.postApiV1ThingsAlarmEventGetList({
        page: { page: 1, size: 10 },
        status: ['alarmActive', 'acked', 'shielded'],
      } as any),
    ]);

    // 逐个收敛 allSettled 结果：fulfilled 取 value，rejected 记日志后兜底 null
    // （内联写法让 map 自行推断联合类型，避免泛型签名与 allSettled 联合结果不匹配）
    const [todayEn, /* energyChart */, /* powerChart */, areaEnergy, deviceStats, alarmRes] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : (console.warn('[dashboard]', r.reason), null),
    );

    todayEnergyRaw.value = filterPropertyLogResponseByAreaIDs(todayEn as any, ids);
    // energyChartRaw / powerChartRaw 已在各自的 fetch 函数中赋值
    if (areaEnergy && Array.isArray((areaEnergy as any).list)) {
      areaEnergyData.value = {
        ...(areaEnergy as any),
        list: filterByRequestedAreaIDs((areaEnergy as any).list, ids),
      };
    } else {
      areaEnergyData.value = areaEnergy;
    }
    deviceStatsData.value = deviceStats;
    alarmRecords.value = (alarmRes as any)?.list ?? [];
  }

  const projectStore = useProjectStore();

  // 监听 projectStore.currentProjectID：
  // - 首次赋值时触发 loadDashboard()（解决 onMounted 时 project 尚未就绪的竞态）
  // - 切换项目时重新加载
  watch(
    () => projectStore.currentProjectID,
    (pid) => {
      if (pid) {
        loadDashboard();
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    refreshTimer = setInterval(() => {
      if (effectiveAreaIDs.value.length > 0) fetchData().catch(() => {});
    }, 60_000);
  });

  onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer);
  });

  /** 从功率趋势时序数据派生统计（avg / min / max） */
  const powerStats = computed(() => {
    const list: any[] = powerChartRaw.value?.data?.list ?? [];
    if (!list.length) return { avg: 0, min: 0, max: 0 };
    // 按时间戳聚合各区域值之和，得到每个时间点的总功率
    const tsMap = new Map<string, number>();
    for (const item of list) {
      const ts = String(item.timestamp ?? item.timeWindow);
      tsMap.set(ts, (tsMap.get(ts) ?? 0) + Number(item.value ?? 0));
    }
    const totals = [...tsMap.values()];
    const sum = totals.reduce((s, v) => s + v, 0);
    return {
      avg: totals.length ? sum / totals.length : 0,
      min: Math.min(...totals),
      max: Math.max(...totals),
    };
  });

  /** 实时功率 = 功率趋势中最新时间点的各区域值之和 */
  const totalPower = computed(() => {
    const list: any[] = powerChartRaw.value?.data?.list ?? [];
    if (!list.length) return 0;
    // 找到最大时间戳
    let maxTs = '';
    for (const item of list) {
      const ts = String(item.timestamp ?? item.timeWindow);
      if (ts > maxTs) maxTs = ts;
    }
    // 对最大时间戳下所有区域值求和
    return list
      .filter((i) => String(i.timestamp ?? i.timeWindow) === maxTs)
      .reduce((s, i) => s + Number(i.value ?? 0), 0);
  });

  /** 今日用电量 = todayEnergyRaw 各区域值求和 */
  const todayEnergy = computed(() => {
    const list: any[] = todayEnergyRaw.value?.list ?? [];
    return list.reduce((s: number, i: any) => s + Number(i?.value ?? 0), 0);
  });

  /** PropertyLogGetList 返回 { list: [{ timestamp, value, dataID }] } */
  const energyChartData = computed(() => {
    const raw = energyChartRaw.value;
    const list: any[] = raw?.data?.list ?? [];
    const fmt = raw?.format ?? $t('orgIotClient.energyDashboard.monthFormat', { m: 'M' });
    // 按 timeWindow 聚合求和（可能有多区域合并的同时间点）
    const map = new Map<string, number>();
    for (const item of list) {
      const ts = item.timestamp ?? item.timeWindow;
      map.set(ts, (map.get(ts) ?? 0) + Number(item.value ?? 0));
    }
    const sorted = [...map.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
    return {
      xData: sorted.map(([ts]) => dayjs(Number(ts)).format(fmt)),
      yData: sorted.map(([, v]) => v),
    };
  });

  const powerChartData = computed(() => {
    const raw = powerChartRaw.value;
    const list: any[] = raw?.data?.list ?? [];
    const fmt = raw?.format ?? 'HH:mm';
    // 按 timestamp 聚合求平均
    const map = new Map<string, { sum: number; count: number }>();
    for (const item of list) {
      const ts = item.timestamp ?? item.timeWindow;
      const entry = map.get(ts) ?? { sum: 0, count: 0 };
      entry.sum += Number(item.value ?? 0);
      entry.count += 1;
      map.set(ts, entry);
    }
    const sorted = [...map.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
    return {
      xData: sorted.map(([ts]) => dayjs(Number(ts)).format(fmt)),
      yData: sorted.map(([, e]) => e.sum / e.count),
    };
  });

  const areaEnergyChartData = computed(() => {
    const list = areaEnergyData.value?.list ?? [];
    const names: string[] = [];
    const values: number[] = [];
    for (const item of list) {
      const areaInfo = areaNames.value.find((a) => a.areaID === item.areaID);
      names.push(areaInfo?.areaName ?? item.areaID ?? $t('orgIotClient.deviceSpace.unknown'));
      const sum = item.values?.[0]?.values?.sum?.value ?? 0;
      values.push(Number(sum));
    }
    return { names, values };
  });

  // 设备在线/离线统计
  const deviceOnlineStats = computed(() => {
    const result = { total: 0, online: 0, offline: 0 };
    const onlineList = (deviceStatsData.value?.list ?? [])[0] ?? [];
    for (const item of onlineList) {
      const count = Number(item.total ?? 0);
      result.total += count;
      if (item.isOnline === 1) result.online = count;
      else if (item.isOnline === 2) result.offline = count;
    }
    return result;
  });

  // 设备状态分布（用于饼图）
  const deviceStatusStats = computed(() => {
    const statusList = (deviceStatsData.value?.list ?? [])[1] ?? [];
    const data: { name: string; value: number; color: string }[] = [];
    let total = 0;
    const c = theme.value;
    const statusMap: Record<
      number,
      { name: string; color: string }
    > = {
      1: { name: $t('orgIotClient.deviceStatus.inactive'), color: c.chartColors[5] ?? '#78350f' },
      2: { name: $t('orgIotClient.deviceStatus.online'), color: c.chartColors[0] ?? '#fbbf24' },
      3: { name: $t('orgIotClient.deviceStatus.offline'), color: c.chartColors[4] ?? '#92400e' },
      4: { name: $t('orgIotClient.deviceStatus.fault'), color: c.chartColors[2] ?? '#d97706' },
    };
    for (const item of statusList) {
      const count = Number(item.total ?? 0);
      total += count;
      const info = statusMap[item.status as number] ?? {
        name: $t('orgIotClient.energyDashboard.statusName', { status: item.status }),
        color: '#64748b',
      };
      if (count > 0) {
        data.push({ name: info.name, value: count, color: info.color });
      }
    }
    return { data, total };
  });

  return {
    areaLoading,
    powerStats,
    totalPower,
    todayEnergy,
    energyTimeUnit,
    energyChartData,
    setEnergyTimeUnit,
    powerTimeRange,
    powerChartData,
    setPowerTimeRange,
    areaEnergyChartData,
    areaNames,
    deviceOnlineStats,
    deviceStatusStats,
    alarmRecords,
    areaTreeOptions,
    selectedAreaKey,
    setSelectedArea,
  };
}
