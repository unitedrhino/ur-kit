import { ThingsApi } from '@vben/api';

//@ts-ignore
import { toNumber } from 'lodash';

// 设备状态码对应的统一中文展示文案。
const deviceStatusLabelMap: Record<number, string> = {
  1: '未激活',
  2: '在线',
  3: '离线',
  4: '异常(频繁上下线,告警中)',
  5: '服务过期（仅 4G 设备）',
};

// 获取设备状态文本和类型
export function getDeviceStatusInfo(status: number) {
  const statusMap = {
    1: { color: '#BBBBC8', textColor: '#FFFFFF' }, //未激活
    2: { color: '#09C9A7', textColor: '#FFFFFF' }, //在线
    3: { color: '#BBBBC8', textColor: '#FFFFFF' }, //离线
    4: { color: '#FFB23C', textColor: '#FFFFFF' }, //异常
    5: { color: '#F56C6C', textColor: '#FFFFFF' }, //服务过期（仅4G设备）
  };
  return (
    statusMap[status as keyof typeof statusMap] || {
      text: '未知',
      type: 'default' as const,
    }
  );
}

/**
 * 将设备状态码转换为设备管理页面统一展示的中文文案。
 * @param status 设备状态码。
 * @returns 状态展示文案，未知状态返回“未知”。
 */
export function getDeviceStatusLabel(status: number) {
  return deviceStatusLabelMap[status] || '未知';
}

export function getDevicesList(page: number, pageSize: number, queryParams: any): Promise<ThingsApi.DeviceInfoIndexResp> {
  try {
    const query_node_type = queryParams?.node_type;
    const query_node_area = queryParams?.node_area;
    const query_device_name = queryParams?.deviceName;
    const query_device_alias = queryParams?.deviceAlias;
    // const query_gateway = ;
    const query_device_status = queryParams?.deviceStatus ? toNumber(queryParams.deviceStatus) : undefined;

    // const gateway = gatewaySelectMap.value.find(item => item.id === query_gateway);
    const gateway = JSON.parse(queryParams?.gateway || '{}');

    const query_gateway_obj = {
      productID: gateway?.productID || '',
      deviceName: gateway?.deviceName || '',
    };

    return new Promise((resolve, reject) => {
      ThingsApi.postApiV1ThingsDeviceInfoIndex({
        page: {
          page: page,
          size: pageSize,
        },
        withGateway: true,
        ...(query_node_area ? (query_node_type == 'building' ? { groupID: query_node_area } : { areaID: query_node_area }) : {}),
        ...(query_device_name ? { deviceName: query_device_name } : {}),
        ...(query_device_alias ? { deviceAlias: query_device_alias } : {}),
        ...(queryParams?.gateway ? { gateway: query_gateway_obj } : {}),
        ...(query_device_status ? { status: query_device_status } : {}),
      })
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  } catch (err) {
    return Promise.reject({
      list: [],
      total: 0,
    });
  }
}
