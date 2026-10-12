/**
 * 文件说明：告警触发条件模板元数据加载
 * 负责加载绑定范围选项（产品品类 / 产品）以及根据绑定范围加载物模型 schema。
 * 物模型字段只使用后端接口返回的真实数据。
 */
import type { AlarmObjectSchema, AlarmTarget } from '../types/alarm-v2.types';

import { computed, ref } from 'vue';

import { ThingsApi } from '@vben/api';

import { useAlarmSchema } from './useAlarmSchema';

/** 绑定范围选项 */
export interface BindOption {
  /** 绑定类型 */
  value: 'category' | 'product';
  /** 类型显示文本 */
  label: string;
  /** 可选值列表 */
  children: BindOptionChild[];
}

/** 绑定范围子选项 */
interface BindOptionChild {
  /** 选项值：品类 ID 或产品 ID */
  value: string;
  /** 选项显示文本 */
  label: string;
}

/**
 * 加载告警触发条件模板所需的元数据
 * @returns 绑定选项、schema、加载方法及辅助函数
 */
export function useAlarmTemplateMeta() {
  const loading = ref(false);
  const error = ref('');

  /** 产品品类列表 */
  const categories = ref<ThingsApi.ProductCategory[]>([]);
  /** 产品列表 */
  const products = ref<ThingsApi.ProductInfo[]>([]);

  const { schema: rawSchema, loadSchema: loadAlarmSchema } = useAlarmSchema();

  /**
   * 绑定范围下拉选项
   * 只展示后端返回的真实产品品类和产品
   */
  const bindOptions = computed<BindOption[]>(() => {
    const categoryChildren: BindOptionChild[] = categories.value.map((item) => ({ value: item.id ?? '', label: item.name ?? '' })).filter((item) => item.value);

    const productChildren: BindOptionChild[] = products.value
      .map((item) => ({ value: item.productID ?? '', label: item.productName ?? '' }))
      .filter((item) => item.value);

    // label 保存 i18n 键，渲染处以 $t 输出当前语言文案
    return [
      { value: 'category', label: 'iotApp.alarmCondTpl.categoryOpt', children: categoryChildren },
      { value: 'product', label: 'iotApp.alarmRule.productLabel', children: productChildren },
    ];
  });

  /** 当前生效的真实物模型 schema */
  const schema = computed<AlarmObjectSchema>(() => rawSchema.value);

  /**
   * 加载品类和产品列表
   * 任一接口失败时记录错误并保留空数组
   */
  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const [categoryResp, productResp] = await Promise.all([
        ThingsApi.postApiV1ThingsProductCategoryGetList({ page: { page: 1, size: 1000 } }),
        ThingsApi.postApiV1ThingsProductInfoGetList({ page: { page: 1, size: 1000 } }),
      ]);
      categories.value = categoryResp.list ?? [];
      products.value = productResp.list ?? [];
    } catch (error_: any) {
      error.value = error_?.message ?? '加载绑定范围数据失败';
      console.error('加载绑定范围数据失败', error_);
      categories.value = [];
      products.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 根据当前绑定范围加载物模型 schema
   * @param bindType 绑定类型
   * @param bindValue 绑定值：品类 ID 或产品 ID
   */
  async function loadSchema(bindType: 'category' | 'product', bindValue: string) {
    if (!bindValue) {
      return;
    }
    const target: AlarmTarget = {
      selectType: 'all',
      targetKind: bindType,
      categoryID: bindType === 'category' ? bindValue : undefined,
      productID: bindType === 'product' ? bindValue : undefined,
    };
    await loadAlarmSchema(target);
  }

  /**
   * 根据绑定值查找显示文本
   * @param bindType 绑定类型
   * @param bindValue 绑定值
   * @returns 显示文本，找不到时返回原值
   */
  function bindValueLabel(bindType: 'category' | 'product', bindValue: string): string {
    const option = bindOptions.value.find((item) => item.value === bindType);
    const child = option?.children.find((item) => item.value === bindValue);
    return child?.label ?? bindValue;
  }

  return {
    loading,
    error,
    bindOptions,
    schema,
    load,
    loadSchema,
    bindValueLabel,
  };
}
