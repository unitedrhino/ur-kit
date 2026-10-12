/**
 * 加载选项：产品 / 区域 / 设备组 / 设备 / 物模型。
 * 设备列表与物模型按需加载（避免所有 trigger 共用缓存导致串味）。
 */

import { computed, ref } from 'vue';
import { useArea, useGroup, useProduct } from '@vben/stores';
import { Api } from '../../index.api';

export interface SelectOption {
  label: string;
  value: string | number;
}

/** useSceneOptions 加载场景编辑器的产品、区域和设备组下拉选项。 */
export function useSceneOptions() {
  const { getProductOptions, ensureProducts } = useProduct();
  const { getAreaOptions } = useArea();
  const { getGroupOptions } = useGroup();

  // 客户端应用不会在启动时预加载产品，场景编辑器需要自行确保下拉数据可用。
  void ensureProducts().catch(() => undefined);

  const productOptions = computed<SelectOption[]>(
    () => getProductOptions() as any,
  );
  const areaOptions = computed<SelectOption[]>(() => getAreaOptions() as any);
  const groupOptions = computed<SelectOption[]>(() => getGroupOptions() as any);

  return { productOptions, areaOptions, groupOptions };
}

/** 根据 productID 加载设备列表（用于 EntityCombobox 远程搜索） */
export function useDeviceOptions() {
  const loading = ref(false);
  const options = ref<SelectOption[]>([]);

  async function load(productID?: string, keyword?: string) {
    if (!productID) {
      options.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await Api.deviceIndex({
        page: { page: 1, size: 200 },
        productID,
        ...(keyword ? { deviceAlias: keyword } : {}),
      });
      options.value = ((res as any).list || []).map((item: any) => ({
        label: `${item.deviceAlias}(${item.deviceName})`,
        value: item.deviceName,
      }));
    } finally {
      loading.value = false;
    }
  }

  return { loading, options, load };
}

/** 物模型加载（属性/事件） */
export function useSchemaOptions() {
  const loading = ref(false);
  const list = ref<any[]>([]);

  async function loadForProduct(productID?: string, type?: number) {
    if (!productID) {
      list.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await Api.productSchemaIndex({ productID, type } as any);
      list.value = (res as any).list || [];
    } finally {
      loading.value = false;
    }
  }

  async function loadForDevice(
    productID?: string,
    deviceName?: string,
    type?: number,
  ) {
    if (!productID || !deviceName) {
      list.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await Api.deviceSchemaIndex({
        productID,
        deviceName,
        type,
      } as any);
      list.value = (res as any).list || [];
    } finally {
      loading.value = false;
    }
  }

  return { loading, list, loadForProduct, loadForDevice };
}
