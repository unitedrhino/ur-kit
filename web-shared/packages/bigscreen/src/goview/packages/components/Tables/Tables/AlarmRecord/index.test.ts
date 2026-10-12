// @vitest-environment happy-dom
/**
 * 文件说明：验证告警记录大屏组件的数据兼容、只读详情交互与预览态边界。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AlarmRecord from './index.vue';
import { extractAlarmRowMetadata, normalizeAlarmStatus } from './model';

const testState = vi.hoisted(() => ({
  dataCallback: undefined as ((data: unknown) => void) | undefined,
  preview: true,
  post: vi.fn(),
}));

vi.mock('@/hooks', () => ({
  useChartDataFetch: (_config: unknown, _store: unknown, callback: (data: unknown) => void) => {
    testState.dataCallback = callback;
    return { vChartRef: { value: null } };
  },
}));

vi.mock('@/store/modules/chartEditStore/chartEditStore', () => ({
  useChartEditStore: vi.fn(),
}));

vi.mock('@/utils', () => ({
  isPreview: () => testState.preview,
}));

vi.mock('@/api/http', () => ({
  post: (...args: unknown[]) => testState.post(...args),
}));

const chartConfig = () =>
  ({
    attr: { w: 720, h: 320 },
    chartConfig: { key: 'AlarmRecord' },
    filter: '',
    option: {
      align: ['center', 'center', 'left', 'left', 'center'],
      borderKey: 'Border01',
      borderOption: { borderTitle: { show: true, text: '告警记录' } },
      carousel: 'single',
      columnWidth: [152, 68, 118, 292],
      containerType: 'border',
      dataset: [],
      detailRequestUrl: '/api/v1/things/alarm/event/get-one',
      displayDecimals: 0,
      evenRowBGC: '#091c2c',
      header: ['时间', '级别', '告警对象', '告警内容', '状态'],
      headerBGC: '#0b5470',
      headerHeight: 38,
      hoverPause: true,
      index: false,
      levelMap: {
        critical: { color: '#ff4d4f', label: '紧急' },
        major: { color: '#ff9f43', label: '重要' },
        minor: { color: '#f6c344', label: '次要' },
        remind: { color: '#2f9bff', label: '提醒' },
      },
      oddRowBGC: '#0c2638',
      padding: 12,
      rowNum: 5,
      waitTime: 3,
    },
    request: {},
  }) as any;

const mountComponent = () =>
  mount(AlarmRecord, {
    props: { chartConfig: chartConfig() },
    global: {
      stubs: {
        DecoratedTableView: { template: '<div><slot /></div>' },
        NModal: {
          props: ['show', 'closable'],
          template: '<div v-if="show" data-testid="alarm-detail-modal" :data-native-close="String(closable)"><slot name="header" /><slot /></div>',
        },
        NSpin: { template: '<div><slot /></div>' },
      },
    },
  });

const richDataset = {
  dimensions: [
    { key: 'time', title: '时间' },
    { key: 'level', title: '级别' },
    { key: 'target', title: '告警对象' },
    { key: 'content', title: '告警内容' },
    { key: 'status', title: '状态' },
  ],
  source: [
    {
      __alarmEvent: { id: 'alarm-1', status: 'normal', triggerValue: '87.5' },
      content: '温度超过阈值',
      level: '紧急',
      status: '已恢复',
      target: '1 号电表',
      time: '2026-09-09 10:00:00',
    },
  ],
};

describe('alarmRecord 数据合同', () => {
  it('把 normal 与兼容值 recovered 都映射为已恢复', () => {
    expect(normalizeAlarmStatus('normal').label).toBe('已恢复');
    expect(normalizeAlarmStatus('recovered').label).toBe('已恢复');
  });

  it('从富数据集保留事件元数据，并兼容旧二维数组', () => {
    expect(extractAlarmRowMetadata(richDataset)).toEqual([expect.objectContaining({ id: 'alarm-1', triggerValue: '87.5' })]);
    expect(extractAlarmRowMetadata([['时间', '紧急', '对象', '内容', '已恢复']])).toEqual([null]);
  });
});

describe('alarmRecord 详情交互', () => {
  beforeEach(() => {
    testState.preview = true;
    testState.dataCallback = undefined;
    testState.post.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('仅在预览态通过点击或键盘打开只读详情', async () => {
    testState.post.mockResolvedValue({
      code: 200,
      data: {
        dealRecords: [{ action: 'ack', createdTime: 1, id: 'deal-1', operatorName: '值班员' }],
        event: { id: 'alarm-1', alarmName: '高温告警', status: 'normal', triggerContent: '温度超过阈值' },
        notifyRecords: [{ channel: 'webhook', createdTime: 2, id: 'notify-1', status: 'success' }],
      },
    });
    const wrapper = mountComponent();
    testState.dataCallback?.(richDataset);
    await flushPromises();

    const row = wrapper.get('[data-testid="alarm-row"]');
    expect(row.attributes('tabindex')).toBe('0');
    await row.trigger('keydown', { key: 'Enter' });
    await flushPromises();

    expect(testState.post).toHaveBeenCalledWith('/api/v1/things/alarm/event/get-one', { id: 'alarm-1' });
    expect(wrapper.get('[data-testid="alarm-detail-modal"]').attributes('data-native-close')).toBe('false');
    expect(wrapper.get('[data-testid="alarm-detail-modal"]').text()).toContain('高温告警');
    expect(wrapper.text()).toContain('处置记录');
    expect(wrapper.text()).toContain('通知记录');

    await wrapper.get('[data-testid="alarm-detail-close"]').trigger('click');
    await flushPromises();
    await row.trigger('keydown', { key: ' ' });
    await flushPromises();
    expect(testState.post).toHaveBeenCalledTimes(2);
  });

  it('编辑态不响应整行点击', async () => {
    testState.preview = false;
    const wrapper = mountComponent();
    testState.dataCallback?.(richDataset);
    await flushPromises();

    const row = wrapper.get('[data-testid="alarm-row"]');
    expect(row.attributes('tabindex')).toBeUndefined();
    await row.trigger('click');
    expect(testState.post).not.toHaveBeenCalled();
  });

  it('详情加载失败可重试，空详情可关闭', async () => {
    testState.post.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ code: 200, data: { dealRecords: [], event: null, notifyRecords: [] } });
    const wrapper = mountComponent();
    testState.dataCallback?.(richDataset);
    await flushPromises();
    await wrapper.get('[data-testid="alarm-row"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('详情加载失败');
    await wrapper.get('[data-testid="alarm-detail-retry"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('未找到告警详情');
    await wrapper.get('[data-testid="alarm-detail-close"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="alarm-detail-modal"]').exists()).toBe(false);
  });
});
