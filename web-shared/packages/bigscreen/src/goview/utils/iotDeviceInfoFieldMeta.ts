/** 文件说明：设备字段名称与枚举值展示翻译，未知业务值保持原样。 */
import { $t as editorT } from '@vben/saas/locales';
import { useDictStore } from '@vben/saas';

/** 预定义设备字段标签，读取时跟随宿主语言。 */
const DEVICE_INFO_FIELD_LABELS: Record<string, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get deviceType() { return editorT('iotApp.productPage.deviceType'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get isEnable() { return editorT('iotApp.deviceDetail.enableStatus'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get isOnline() { return editorT('iotApp.cardRoute.onlineStatus'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get logLevel() { return editorT('iotApp.devicePage.logLevel'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get mobileOperator() { return editorT('iotApp.deviceDetail.mobileOperator'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get netType() { return editorT('iotApp.productPage.networkType'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get ratedPower() { return editorT('iotApp.deviceDetail.ratedPower'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get rssi() { return editorT('iot.device.rssi'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get sort() { return editorT('orgManage.menuManage.sort'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get status() { return editorT('iotApp.deviceDetail.deviceStatusLabel'); },
};

/** 返回预定义字段的当前语言标签；未知字段返回字段名。 */
export function getIoTDeviceInfoFieldLabel(field: string) {
  return DEVICE_INFO_FIELD_LABELS[field] ?? field;
}

/** 同时显示字段标签与稳定字段名，便于配置数据映射。 */
export function getIoTDeviceInfoFieldDisplayLabel(field: string) {
  const label = getIoTDeviceInfoFieldLabel(field);
  return label === field ? field : `${label}（${field}）`;
}

/** 已知枚举的显示标签，保留数值与协议名称。 */
const DEVICE_TYPE_VALUE_LABELS: Record<number, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 1() { return editorT('iotApp.devicePage.typeDevice'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 2() { return editorT('iotApp.devicePage.typeGateway'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 3() { return editorT('iotApp.devicePage.typeSub'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 4() { return editorT('iotApp.deviceDetail.monitorDevice'); },
};

/** 已知枚举的显示标签，保留数值与协议名称。 */
const IS_ENABLE_VALUE_LABELS: Record<number, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 0() { return editorT('iotApp.deviceDetail.disabled'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 1() { return editorT('iotApp.deviceDetail.enabled'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 2() { return editorT('iotApp.deviceDetail.disabled'); },
};

/** 已知枚举的显示标签，保留数值与协议名称。 */
const IS_ONLINE_VALUE_LABELS: Record<number, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 1() { return editorT('iotApp.deviceDetail.offlineState'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 2() { return editorT('iotApp.deviceDetail.online'); },
};

/** 已知枚举的显示标签，保留数值与协议名称。 */
const LOG_LEVEL_VALUE_LABELS: Record<number, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 1() { return editorT('orgManage.common.close'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 2() { return editorT('iotApp.devicePage.logError'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 3() { return editorT('iotApp.devicePage.logWarn'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 4() { return editorT('iotApp.devicePage.logInfo'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 5() { return editorT('iotApp.devicePage.logDebug'); },
};

/** 已知枚举的显示标签，保留数值与协议名称。 */
const MOBILE_OPERATOR_VALUE_LABELS: Record<number, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 1() { return editorT('iotApp.devicePage.carrierMobile'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 2() { return editorT('iotApp.devicePage.carrierUnicom'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 3() { return editorT('iotApp.devicePage.carrierTelecom'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 4() { return editorT('iotApp.deviceDetail.broadcast'); },
};

/** 已知枚举的显示标签，保留数值与协议名称。 */
const NET_TYPE_VALUE_LABELS: Record<number, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 1() { return editorT('iotApp.devicePage.other'); },
  2: 'Wi-Fi',
  3: '2G/3G/4G',
  4: '5G',
  5: 'BLE',
  6: 'LoRaWAN',
  7: 'Wi-Fi + BLE',
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 8() { return editorT('iotApp.devicePage.ethernet'); },
  9: '4G + BLE',
};

/** 已知枚举的显示标签，保留数值与协议名称。 */
const STATUS_VALUE_LABELS: Record<number, string> = {
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 1() { return editorT('iotApp.devicePage.statusUnactivated'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 2() { return editorT('iotApp.deviceDetail.online'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 3() { return editorT('iotApp.deviceDetail.offlineState'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 4() { return editorT('iotApp.project.abnormal'); },
  /** 根据当前语言显示预定义设备字段或状态，保留底层字段值。 */
  get 5() { return editorT('orgManage.common.disabled'); },
};

/** 将有限数值及数字字符串归一化；非数值返回空值。 */
function normalizeNumericValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** 保留服务端自定义字典标签，仅转换已知网络类型种子标签。 */
function resolveDictLabel(dictCode: string, value: number) {
  try {
    const dictStore = useDictStore();
    const option = dictStore
      .getDictMap(dictCode)
      ?.find((item: any) => Number(item?.value) === value);
    const label = option?.label ? String(option.label) : null;
    if (dictCode === 'deviceNetType' && label === '有线网络') return editorT('iotApp.devicePage.ethernet');
    if (dictCode === 'deviceNetType' && label === '其他') return editorT('iotApp.devicePage.other');
    return label;
  } catch {
    return null;
  }
}

/** 按字段解释设备枚举；未知字段与未知枚举保留原始业务值。 */
export function getIoTDeviceInfoFieldSemanticValue(field: string, value: unknown): string | unknown {
  const normalizedValue = normalizeNumericValue(value);

  switch (field) {
    case 'deviceType':
      return normalizedValue !== null ? (DEVICE_TYPE_VALUE_LABELS[normalizedValue] ?? value) : value;
    case 'isEnable':
      return normalizedValue !== null ? (IS_ENABLE_VALUE_LABELS[normalizedValue] ?? value) : value;
    case 'isOnline':
      return normalizedValue !== null ? (IS_ONLINE_VALUE_LABELS[normalizedValue] ?? value) : value;
    case 'logLevel':
      return normalizedValue !== null ? (LOG_LEVEL_VALUE_LABELS[normalizedValue] ?? value) : value;
    case 'mobileOperator':
      return normalizedValue !== null ? (MOBILE_OPERATOR_VALUE_LABELS[normalizedValue] ?? value) : value;
    case 'netType':
      if (normalizedValue === null) return value;
      return resolveDictLabel('deviceNetType', normalizedValue) ?? NET_TYPE_VALUE_LABELS[normalizedValue] ?? value;
    case 'status':
      return normalizedValue !== null ? (STATUS_VALUE_LABELS[normalizedValue] ?? value) : value;
    default:
      return value;
  }
}
