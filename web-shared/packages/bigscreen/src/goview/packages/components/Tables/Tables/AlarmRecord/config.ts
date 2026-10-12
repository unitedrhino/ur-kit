/**
 * 文件说明：定义告警记录组件的默认视觉、数据过滤与接口请求配置。
 */
import type { CreateComponentType } from '@/packages/index.type';

import { RequestBodyEnum, RequestDataTypeEnum, RequestHttpEnum, RequestHttpIntervalEnum } from '@/enums/httpEnum';
import { createBorderContainerOption } from '@/packages/components/Charts/shared/decoratedChartOptions';
import { PublicConfigClass } from '@/packages/public';
import cloneDeep from 'lodash/cloneDeep';

import dataJson from './data.json';
import { AlarmRecordConfig } from './index';

export const option = {
  header: ['时间', '级别', '告警对象', '告警内容', '状态'],
  dataset: dataJson,
  index: false,
  columnWidth: [152, 68, 118, 292],
  align: ['center', 'center', 'left', 'left', 'center'],
  rowNum: 5,
  waitTime: 3,
  headerHeight: 35,
  displayDecimals: 0,
  containerType: 'border',
  borderKey: 'Border01',
  borderOption: createBorderContainerOption('Border01'),
  padding: 12,
  carousel: 'single',
  headerBGC: '#0B5470',
  oddRowBGC: '#0C2638',
  evenRowBGC: '#091C2C',
  detailRequestUrl: '/api/v1/things/alarm/event/get-one',
  // 告警级别 → 显示文本/颜色（与告警页面 AlarmLevelList 保持一致）
  levelMap: {
    remind: { label: '提醒', color: '#1677ff' },
    minor: { label: '次要', color: '#faad14' },
    major: { label: '重要', color: '#fa8c16' },
    critical: { label: '紧急', color: '#f5222d' },
  },
};

export default class Config extends PublicConfigClass implements CreateComponentType {
  public chartConfig = cloneDeep(AlarmRecordConfig);
  // 默认 filter 脚本：返回可见维度与原始事件元数据，供预览态详情弹窗使用。
  public override filter: any = `const list = data?.list || []
const levelMap = {
  remind: { label: '提醒', color: '#1677ff' },
  minor: { label: '次要', color: '#faad14' },
  major: { label: '重要', color: '#fa8c16' },
  critical: { label: '紧急', color: '#f5222d' },
}
const statusMap = {
  alarmActive: { label: '报警激活', color: '#f5222d' },
  acked: { label: '已确认', color: '#faad14' },
  shielded: { label: '已屏蔽', color: '#8c8c8c' },
  normal: { label: '已恢复', color: '#52c41a' },
  recovered: { label: '已恢复', color: '#52c41a' },
}
const formatTime = (ts) => {
  if (ts === undefined || ts === null || ts === '') return '-'
  const num = typeof ts === 'number' ? ts : Number(ts)
  if (!Number.isFinite(num) || num <= 0) return '-'
  const d = new Date(num)
  const pad = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}
const source = list.map((d) => {
  const lv = levelMap[d.level] || { label: d.level || '-', color: '#8c8c8c' }
  const st = statusMap[d.status] || { label: d.status || '-', color: '#8c8c8c' }
  return {
    time: formatTime(d.firstTriggerTime || d.lastTriggerTime || d.createdTime),
    level: lv.label,
    target: d.targetName || d.deviceName || '-',
    content: d.triggerContent || d.content || '-',
    status: st.label,
    __alarmEvent: d,
  }
})
return {
  dimensions: [
    { key: 'time', title: '时间' },
    { key: 'level', title: '级别' },
    { key: 'target', title: '告警对象' },
    { key: 'content', title: '告警内容' },
    { key: 'status', title: '状态' },
  ],
  source,
}`;
  public key = AlarmRecordConfig.key;

  public option = cloneDeep(option);

  // 默认请求配置：AJAX 模式轮询告警事件列表接口（按 project-id header 隔离项目）
  public override request = {
    requestDataType: RequestDataTypeEnum.AJAX,
    requestHttpType: RequestHttpEnum.POST,
    requestUrl: '/api/v1/things/alarm/event/get-list',
    requestInterval: 30,
    requestIntervalUnit: RequestHttpIntervalEnum.SECOND,
    requestContentType: 0,
    requestParamsBodyType: RequestBodyEnum.JSON,
    requestSQLContent: { sql: 'select * from  where' },
    requestParams: {
      Body: {
        'form-data': {},
        'x-www-form-urlencoded': {},
        json: '{"page":{"page":1,"pageSize":20}}',
        xml: '',
      },
      Header: {},
      Params: {},
    },
  };
}
