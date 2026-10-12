/**
 * 文件说明：告警前端单元测试使用的后端能力矩阵夹具。
 */
import type { ThingsApi } from '@vben/api';

import { configureAlarmCapabilities } from '../composables/useAlarmCapabilities';

// testAlarmCapability 覆盖规则编辑器当前开放的全部数据源和聚合能力。
export const testAlarmCapability: ThingsApi.AlarmCapability = {
  criteria: [
    { allowedChildren: [], type: 'plain' },
    { allowedChildren: ['plain', 'kOfN'], type: 'duration' },
    { allowedChildren: ['plain', 'rollingAggregate'], type: 'kOfN' },
    { allowedChildren: ['plain'], type: 'rollingAggregate' },
    { allowedChildren: ['plain'], type: 'frequency' },
  ],
  notify: {
    callbackAuthTypes: ['none', 'basic', 'bearer'],
    callbackMethods: ['GET', 'POST'],
    channels: ['sms', 'email', 'message', 'callback'],
    timings: ['trigger', 'recovery', 'both'],
  },
  sources: [
    {
      aggregates: [
        { dataType: 'int', values: ['last', 'max', 'min', 'avg', 'sum', 'count'] },
        { dataType: 'float', values: ['last', 'max', 'min', 'avg', 'sum', 'count'] },
        { dataType: 'bool', values: ['last', 'count'] },
        { dataType: 'enum', values: ['last', 'count'] },
        { dataType: 'string', values: ['last', 'count'] },
        { dataType: 'timestamp', values: ['last', 'count'] },
        { dataType: 'struct', values: ['last', 'count'] },
        { dataType: 'array', values: ['last', 'count'] },
      ],
      compareTypes: ['eq', 'not', 'btw', 'gt', 'gte', 'lt', 'lte', 'in'],
      dataTypes: ['int', 'float', 'bool', 'enum', 'string', 'timestamp', 'struct', 'array'],
      sourceType: 'property',
      supportsFilters: false,
    },
    {
      aggregates: [{ dataType: 'struct', values: ['occurred', 'count'] }],
      compareTypes: ['eq', 'not', 'btw', 'gt', 'gte', 'lt', 'lte', 'in'],
      dataTypes: ['struct'],
      sourceType: 'event',
      supportsFilters: true,
    },
    {
      aggregates: [{ dataType: 'struct', values: ['occurred', 'count'] }],
      compareTypes: ['eq', 'not', 'btw', 'gt', 'gte', 'lt', 'lte', 'in'],
      dataTypes: ['struct'],
      sourceType: 'action',
      supportsFilters: true,
    },
    {
      aggregates: [{
        dataType: 'bool',
        values: [
          'last',
          'onlineDuration',
          'offlineDuration',
          'onlineRate',
          'onlineCount',
          'offlineCount',
          'switchCount',
        ],
      }],
      compareTypes: ['eq', 'not', 'gt', 'gte', 'lt', 'lte'],
      dataTypes: ['bool'],
      sourceType: 'online',
      supportsFilters: false,
    },
  ],
  targets: ['all', 'fixed', 'area', 'areaWithChildren', 'group'],
  version: 'test-v1',
};

/** installTestAlarmCapability 为当前测试模块安装完整能力矩阵。 */
export function installTestAlarmCapability() {
  configureAlarmCapabilities(testAlarmCapability);
}
