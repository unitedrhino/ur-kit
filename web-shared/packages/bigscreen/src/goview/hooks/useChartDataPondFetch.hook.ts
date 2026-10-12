import type { CreateComponentType } from '@/packages/index.type';
import type { RequestDataPondItemType, RequestGlobalConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

import type { ComputedRef } from 'vue';

import { computed, toRaw, watch } from 'vue';

import { customizeHttp } from '@/api/http';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { intervalUnitHandle } from '@/utils';
import { sandboxExecute } from '@/utils/sandboxExecute';

// 获取类型
type ChartEditStoreType = typeof useChartEditStore;

// 数据池存储的数据类型
type DataPondMapType = {
  filter?: string | undefined;
  updateCallback: (...args: any) => any;
};

// 数据池 Map 中请求对应 callback
const mittDataPondMap = new Map<string, DataPondMapType[]>();

// 创建单个数据项轮询接口
const newPondItemInterval = (
  requestGlobalConfig: RequestGlobalConfigType,
  requestDataPondItem: ComputedRef<RequestDataPondItemType>,
  dataPondMapItem?: DataPondMapType[],
) => {
  if (!dataPondMapItem) return;
  let fetchInterval: any = 0;

  clearInterval(fetchInterval);

  // 请求
  const fetchFn = async () => {
    if (!requestDataPondItem.value?.dataPondRequestConfig) return;
    try {
      const res = await customizeHttp(toRaw(requestDataPondItem.value.dataPondRequestConfig), toRaw(requestGlobalConfig));
      if (res) {
        try {
          // 遍历更新回调函数
          for (const item of dataPondMapItem) {
            const filtered = await sandboxExecute(res?.data, res, item.filter);
            item.updateCallback(filtered);
          }
        } catch (error) {
          console.error(error);
          return error;
        }
      }
    } catch (error) {
      return error;
    }
  };

  watch(
    () => requestDataPondItem.value?.dataPondRequestConfig?.requestParams?.Params,
    () => {
      fetchFn();
    },
    {
      immediate: false,
      deep: true,
    },
  );

  // 立即调用
  fetchFn();

  const targetInterval = requestDataPondItem.value?.dataPondRequestConfig?.requestInterval;
  const targetUnit = requestDataPondItem.value?.dataPondRequestConfig?.requestIntervalUnit;

  const globalRequestInterval = requestGlobalConfig.requestInterval;
  const globalUnit = requestGlobalConfig.requestIntervalUnit;

  // 定时时间
  const time = targetInterval || globalRequestInterval;
  // 单位
  const unit = targetInterval ? targetUnit : globalUnit;
  // 开启轮询
  if (time) fetchInterval = setInterval(fetchFn, intervalUnitHandle(time, unit));
};

/**
 * 数据池接口处理
 */
export const useChartDataPondFetch = () => {
  // 新增全局接口
  const addGlobalDataInterface = (targetComponent: CreateComponentType, _useChartEditStore: ChartEditStoreType, updateCallback: (...args: any) => any) => {
    // 组件对应的数据池 Id
    const requestDataPondId = targetComponent.request.requestDataPondId as string;
    // 新增数据项
    const mittPondIdArr = mittDataPondMap.get(requestDataPondId) || [];
    mittPondIdArr.push({
      updateCallback,
      filter: targetComponent.filter,
    });
    mittDataPondMap.set(requestDataPondId, mittPondIdArr);
  };

  // 清除旧数据
  const clearMittDataPondMap = () => {
    mittDataPondMap.clear();
  };

  // 初始化数据池
  const initDataPond = (useChartEditStore: ChartEditStoreType) => {
    const { requestGlobalConfig } = useChartEditStore();
    const chartEditStore = useChartEditStore();
    // 根据 mapId 查找对应的数据池配置
    for (const pondKey of mittDataPondMap.keys()) {
      const requestDataPondItem = computed(() => {
        return requestGlobalConfig.requestDataPond.find((item) => item.dataPondId === pondKey);
      }) as ComputedRef<RequestDataPondItemType>;
      // find() 可能返回 undefined（组件引用了不存在的数据池），需要检查实际值
      if (requestDataPondItem.value) {
        newPondItemInterval(chartEditStore.requestGlobalConfig, requestDataPondItem, mittDataPondMap.get(pondKey));
      }
    }
  };

  return {
    addGlobalDataInterface,
    clearMittDataPondMap,
    initDataPond,
  };
};
