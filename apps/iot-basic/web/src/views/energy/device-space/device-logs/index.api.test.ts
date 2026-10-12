/** 客户端物模型日志查询回归：真实接口要求 dataID，批量历史须保留质量及异常空值。 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** api 模拟正式 SDK 边界，检查页面请求合同和响应合并，不模拟浏览器验收。 */
const api = vi.hoisted(() => ({
  postApiV1ThingsDeviceMsgPropertyLogBatchGetList: vi.fn(),
  postApiV1ThingsDeviceMsgEventLogGetList: vi.fn(),
  postApiV1ThingsDeviceMsgSendLogGetList: vi.fn(),
  postApiV1ThingsDeviceMsgHubLogGetList: vi.fn(),
}));
vi.mock('@vben/api', () => ({ ThingsApi: api }));

import { DeviceLogsApi } from './index.api';

/** query 表示页面在固定历史窗口翻到第二页的请求。 */
const query = { productID: 'quality-product', deviceName: 'quality-device', page: 2, size: 20, timeStart: '1000', timeEnd: '2000' };

describe('客户端属性历史请求', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.postApiV1ThingsDeviceMsgEventLogGetList.mockResolvedValue({ list: [] });
    api.postApiV1ThingsDeviceMsgSendLogGetList.mockResolvedValue({ list: [] });
  });

  it('每个属性携带标识与时间分页，合并后保留 GOOD 零值和 BAD null', async () => {
    const good = { dataID: 'goodValue', value: '0', quality: 'GOOD', receivedTime: 0 };
    const bad = { dataID: 'badValue', value: null, quality: 'BAD', receivedTime: 1002 };
    api.postApiV1ThingsDeviceMsgPropertyLogBatchGetList.mockResolvedValue({ lists: [[good], [bad]] });
    const result = await DeviceLogsApi.getThingModelLogs(query, ['goodValue', 'badValue', 'goodValue']);
    expect(api.postApiV1ThingsDeviceMsgPropertyLogBatchGetList).toHaveBeenCalledWith({ reqs: ['goodValue', 'badValue'].map((dataID) => ({
      dataID, deviceName: query.deviceName, productID: query.productID, order: 2,
      page: { page: 2, size: 20 }, timeStart: '1000', timeEnd: '2000',
    })) });
    expect(result.propertyLogs).toEqual([good, bad]);
    expect(api.postApiV1ThingsDeviceMsgHubLogGetList).not.toHaveBeenCalled();
  });

  it('合法空历史保持空，不用诊断记录冒充属性采样', async () => {
    api.postApiV1ThingsDeviceMsgPropertyLogBatchGetList.mockResolvedValue({ lists: [null, []] });
    expect((await DeviceLogsApi.getThingModelLogs(query, ['a', 'b'])).propertyLogs).toEqual([]);
    expect(api.postApiV1ThingsDeviceMsgHubLogGetList).not.toHaveBeenCalled();
  });

  it('没有属性物模型时不发送缺失 dataID 的请求', async () => {
    expect((await DeviceLogsApi.getThingModelLogs(query, [])).propertyLogs).toEqual([]);
    expect(api.postApiV1ThingsDeviceMsgPropertyLogBatchGetList).not.toHaveBeenCalled();
  });
});
