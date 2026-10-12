import type {
  PropertyAffordance,
  EventAffordance,
  ActionAffordance,
} from '../Affordance/schema-types';

/**
 * 递归转换 Define 对象：number → string, mappingList → mapping（提交给接口时）
 * 注意：只有 enum 类型使用 mappingList，bool 类型直接使用 mapping 对象
 */
export function convertDefineToApi(define: any): any {
  if (!define || typeof define !== 'object') return define;

  const converted = { ...define };

  // 1. 转换数字字段从 number 到 string
  if (converted.min != null) converted.min = String(converted.min);
  if (converted.max != null) converted.max = String(converted.max);
  if (converted.start != null) converted.start = String(converted.start);
  if (converted.step != null) converted.step = String(converted.step);

  // 2. 只对 enum 类型转换 mappingList 数组到 mapping 对象
  // bool 类型的 mapping 保持对象格式不变
  if (converted.type === 'enum' && Array.isArray(converted.mappingList)) {
    converted.mapping = {};
    converted.mappingList.forEach((item: any) => {
      converted.mapping[String(item.key)] = item.value;
    });
    delete converted.mappingList;
  }

  // 3. 递归处理 arrayInfo
  if (converted.arrayInfo) {
    converted.arrayInfo = convertDefineToApi(converted.arrayInfo);
  }

  // 4. 递归处理 specs 数组
  if (Array.isArray(converted.specs)) {
    converted.specs = converted.specs.map((spec: any) => ({
      ...spec,
      dataType: spec.dataType ? convertDefineToApi(spec.dataType) : spec.dataType,
    }));
  }

  return converted;
}

/**
 * 递归转换 Define 对象：string → number, mapping → mappingList（从接口到表单时）
 * 注意：只有 enum 类型使用 mappingList，bool 类型直接使用 mapping 对象
 */
export function convertDefineToForm(define: any): any {
  if (!define || typeof define !== 'object') return define;

  const converted = { ...define };

  // 1. 转换数字字段从 string 到 number
  if (converted.min != null) converted.min = Number(converted.min);
  if (converted.max != null) converted.max = Number(converted.max);
  if (converted.start != null) converted.start = Number(converted.start);
  if (converted.step != null) converted.step = Number(converted.step);

  // 2. 只对 enum 类型转换 mapping 对象到 mappingList 数组
  // bool 类型的 mapping 保持对象格式不变
  if (converted.type === 'enum' && converted.mapping && typeof converted.mapping === 'object' && !Array.isArray(converted.mapping)) {
    converted.mappingList = Object.entries(converted.mapping).map(([key, value]) => ({
      key: Number(key),
      value: value as string,
    }));
    delete converted.mapping;
  }

  // 3. 递归处理 arrayInfo
  if (converted.arrayInfo) {
    converted.arrayInfo = convertDefineToForm(converted.arrayInfo);
  }

  // 4. 递归处理 specs 数组
  if (Array.isArray(converted.specs)) {
    converted.specs = converted.specs.map((spec: any) => ({
      ...spec,
      dataType: spec.dataType ? convertDefineToForm(spec.dataType) : spec.dataType,
    }));
  }

  return converted;
}

/**
 * 数据格式转换函数：表单数据 → API 数据（提交时）
 * - 将 number 转换为 string
 * - 将 mappingList 数组转换为 mapping 对象
 * - 将 affordance 对象转换为 JSON 字符串
 * - 将 modelFeatures 数组映射回原字段
 */
export function transformFormData(rawData: any): any {
  const data = { ...rawData };

  // 处理 modelFeatures 映射回原字段
  if (data.modelFeatures && Array.isArray(data.modelFeatures)) {
    const features = data.modelFeatures;
    console.log('transformFormData - modelFeatures 映射回原字段:', features);

    // 映射 affordance 中的字段（isUseShadow, isNoRecord）
    if (data.affordance) {
      data.affordance.isUseShadow = features.includes('isUseShadow');
      data.affordance.isNoRecord = features.includes('isNoRecord');
      data.affordance.controlMode = features.includes('controlMode') ? 2 : 1;  // 2=只能单控, 1=可以群控,可以单控
      data.affordance.isPassword = features.includes('isPassword') ? 1 : 2;  // 1=是, 2=否
    }

    // 映射根级别字段
    data.funcGroup = features.includes('funcGroup') ? 2 : 1;  // 2=系统功能, 1=普通功能
    // data.isPassword = features.includes('isPassword') ? 1 : 2;  // 1=是, 2=否
    data.isCanSceneLinkage = features.includes('isCanSceneLinkage') ? 1 : 2;  // 1=是, 2=否

    console.log('transformFormData - 映射后的字段:', {
      'affordance.isUseShadow': data.affordance?.isUseShadow,
      'affordance.isNoRecord': data.affordance?.isNoRecord,
      funcGroup: data.funcGroup,
      isPassword: data.isPassword,
      isCanSceneLinkage: data.isCanSceneLinkage,
    });

    // 删除 modelFeatures 字段，因为 API 不需要这个字段
    delete data.modelFeatures;
  }

  // 如果有 affordance，需要进行深度转换
  if (data.affordance) {
    const affordance = { ...data.affordance };

    // 根据不同的物模型类型处理
    // type=1: 属性类型 - 处理 define
    if (data.type === 1 && affordance.define) {
      affordance.define = convertDefineToApi(affordance.define);
    }

    // type=2: 事件类型 - 处理 params
    if (data.type === 2 && affordance.params) {
      affordance.params = affordance.params.map((spec: any) => ({
        ...spec,
        define: spec.define ? convertDefineToApi(spec.define) : spec.define,
      }));
    }

    // type=3: 行为类型 - 处理 input（调用参数）和 output（返回参数）
    if (data.type === 3) {
      if (affordance.input) {
        affordance.input = affordance.input.map((spec: any) => ({
          ...spec,
          define: spec.define ? convertDefineToApi(spec.define) : spec.define,
        }));
      }
      if (affordance.output) {
        affordance.output = affordance.output.map((spec: any) => ({
          ...spec,
          define: spec.define ? convertDefineToApi(spec.define) : spec.define,
        }));
      }
    }

    // 将 affordance 对象转换为 JSON 字符串
    data.affordance = JSON.stringify(affordance);
  }

  return data;
}

/**
 * transformFormData 的反向操作：API 数据 → 表单数据（修改时）
 * - 将 string 转换为 number
 * - 将 mapping 对象转换为 mappingList 数组
 * - 将 affordance JSON 字符串解析为对象
 * - 将原字段映射为 modelFeatures 数组
 */
export function transformApiDataToFormData(rawData: any): any {
  const data = { ...rawData };

  console.log('data=========transformApiDataToFormData data=', data);

  // 如果有 affordance，需要进行深度转换
  if (data?.affordance) {
    // 如果是字符串才需要解析，如果已经是对象则直接使用
    if (typeof data.affordance === 'string') {
      data.affordance = JSON.parse(data.affordance);
    }

    const affordance = { ...data.affordance };

    // 根据不同的物模型类型处理
    // type=1: 属性类型 - 处理 define
    if (data.type === 1 && affordance.define) {
      affordance.define = convertDefineToForm(affordance.define);
    }

    // type=2: 事件类型 - 处理 params
    if (data.type === 2 && affordance.params) {
      affordance.params = affordance.params.map((spec: any) => ({
        ...spec,
        define: spec.define ? convertDefineToForm(spec.define) : spec.define,
      }));
    }

    // type=3: 行为类型 - 处理 input（调用参数）和 output（返回参数）
    if (data.type === 3) {
      if (affordance.input) {
        affordance.input = affordance.input.map((spec: any) => ({
          ...spec,
          define: spec.define ? convertDefineToForm(spec.define) : spec.define,
        }));
      }
      if (affordance.output) {
        affordance.output = affordance.output.map((spec: any) => ({
          ...spec,
          define: spec.define ? convertDefineToForm(spec.define) : spec.define,
        }));
      }
    }

    data.affordance = affordance;
  }

  // 将原字段映射为 modelFeatures 数组
  const modelFeatures: string[] = [];

  console.log('transformApiDataToFormData - 原始字段:', {
    'affordance.isUseShadow': data.affordance?.isUseShadow,
    'affordance.isNoRecord': data.affordance?.isNoRecord,
    funcGroup: data.funcGroup,
    isPassword: data.isPassword,
    isCanSceneLinkage: data.isCanSceneLinkage,
  });

  // 从 affordance 中映射
  if (data.affordance) {
    if (data.affordance.isUseShadow === true) {
      modelFeatures.push('isUseShadow');
    }
    if (data.affordance.isNoRecord === true) {
      modelFeatures.push('isNoRecord');
    }
  }

  // 从根级别字段映射
  if (data.funcGroup === 2) {  // 2=系统功能
    modelFeatures.push('funcGroup');
  }
  if (data.isPassword === 1) {  // 1=是
    modelFeatures.push('isPassword');
  }
  if (data.isCanSceneLinkage === 1) {  // 1=是
    modelFeatures.push('isCanSceneLinkage');
  }

  // 添加 modelFeatures 到表单数据
  data.modelFeatures = modelFeatures;

  console.log('transformApiDataToFormData - 生成的 modelFeatures:', modelFeatures);

  return data;
}
