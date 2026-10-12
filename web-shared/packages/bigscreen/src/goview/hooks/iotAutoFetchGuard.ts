import type { RequestIoTDeviceConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

import { RequestDataTypeEnum } from '../enums/httpEnum';

type QueryType = 'deviceInfo' | 'deviceStatus' | 'property';

export function shouldRunIotAutoFetch(
  requestDataType: RequestDataTypeEnum | number | undefined,
  cfg: RequestIoTDeviceConfigType | undefined,
) {
  if (requestDataType !== RequestDataTypeEnum.IoTDevice || !cfg) {
    return false;
  }

  const queryType = (cfg.queryType ?? 'property') as QueryType;
  const isTemplateMode = queryType === 'property' && !!cfg.chartMode;
  const hasProductScope = !!cfg.productID || !!cfg.productCategoryCode;

  // 设备状态统计允许不选产品，按当前可见设备范围自动汇总。
  if (queryType !== 'deviceStatus' && !hasProductScope) {
    return false;
  }

  if (queryType === 'property' && !isTemplateMode && (!cfg.deviceNames?.length || !cfg.dataIDs?.length)) {
    return false;
  }

  if (queryType === 'property' && isTemplateMode && !cfg.dataIDs?.length) {
    return false;
  }

  if (queryType === 'deviceInfo' && !cfg.deviceNames?.length) {
    return false;
  }

  return true;
}
