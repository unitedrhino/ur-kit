// 部分 mock：保留 loadLocalesMapFromDir 等真实导出（组件 import 链依赖），
// 仅将 $t 替换为直查 zh-CN 语言包 JSON 的实现（键缺失时返回键本身，不掩盖裸键）。
vi.mock('@vben/locales', async (importOriginal) => {
  const orgIotClient = (await import('../../../../../../../packages/saas/src/locales/langs/zh-CN/orgIotClient.json')).default;
  return {
    ...(await importOriginal<typeof import('@vben/locales')>()),
    $t: (key: string, args?: Record<string, unknown>) => {
      let text: string = key;
      {
        // 语言包为嵌套结构：orgIotClient.deviceLogs.xxx → orgIotClient.deviceLogs.xxx
        const parts = key.split('.');
        let cursor: any = parts[0] === 'orgIotClient' ? orgIotClient : undefined;
        for (const p of parts.slice(1)) {
          cursor = cursor?.[p];
        }
        if (typeof cursor === 'string') text = cursor;
      }
      if (args) {
        for (const [k, v] of Object.entries(args)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    },
  };
});

import { describe, expect, it, vi } from 'vitest';

import {
  buildSchemaNameMap,
  groupTimelineItems,
  mergeAndSortTimelineItems,
  normalizeControlLog,
  normalizeEventLog,
  normalizePropertyLog,
  normalizeStatusLog,
} from './normalizers';
import { createTimeRangeFromPreset } from './time-range';

describe('org-iot-client device log aggregation', () => {
  it('builds the default recent time range from the current clock', () => {
    const range = createTimeRangeFromPreset('last30m', new Date('2026-05-28T12:00:00+08:00'));

    expect(range.timeStart).toBe(String(new Date('2026-05-28T11:30:00+08:00').getTime()));
    expect(range.timeEnd).toBe(String(new Date('2026-05-28T12:00:00+08:00').getTime()));
    expect(range.label).toBe('近30分钟');
  });

  it('normalizes status logs into online and offline timeline items', () => {
    const item = normalizeStatusLog({
      deviceName: 'device-001',
      productID: 'product-001',
      status: 2,
      timestamp: '1779940800000',
    });

    expect(item.title).toBe('设备离线');
    expect(item.badgeLabel).toBe('离线');
    expect(item.resultTone).toBe('danger');
  });

  it('uses schema names and result code when normalizing control logs', () => {
    const schemaMap = buildSchemaNameMap([
      { identifier: 'switch', name: '总开关', tag: 1, type: 1 },
      { identifier: 'btn433.2', name: '客厅二路', tag: 1, type: 1 },
    ]);

    const item = normalizeControlLog(
      {
        action: 'propertyControlSend',
        content: '{"value":1}',
        dataID: 'btn433.2',
        resultCode: 200,
        timestamp: '1779940800000',
        traceID: 'trace-1',
        user: { nickName: '小王' },
      },
      schemaMap,
    );

    expect(item.title).toBe('属性控制：客厅二路');
    expect(item.actor).toBe('小王');
    expect(item.badgeLabel).toBe('成功');
    expect(item.detailRows).toEqual(
      expect.arrayContaining([
        { label: '数据标识', value: 'btn433.2' },
        { label: '链路ID', value: 'trace-1' },
      ]),
    );
  });

  it('merges property event and action records into thing-model timeline', () => {
    const schemaMap = buildSchemaNameMap([
      { identifier: 'temperature', name: '温度', tag: 1, type: 1 },
      { identifier: 'fault', name: '故障事件', tag: 1, type: 2 },
      { identifier: 'restart', name: '重启', tag: 1, type: 3 },
    ]);

    const merged = mergeAndSortTimelineItems([
      normalizePropertyLog({ dataID: 'temperature', dataName: '温度', timestamp: '1779940800000', value: '26.5' }, schemaMap),
      normalizeEventLog({ dataID: 'fault', params: '{"code":1}', timestamp: '1779940860000', type: 'alert' }, schemaMap),
      normalizeControlLog({ action: 'actionSend', content: '{}', dataID: 'restart', resultCode: 500, timestamp: '1779940740000' }, schemaMap, 'thingModel'),
    ]);

    expect(merged.map((item) => item.title)).toEqual(['事件上报：故障事件', '属性上报：温度', '行为调用：重启']);
    expect(merged.map((item) => item.badgeLabel)).toEqual(['告警', '良好', '失败']);
  });

  it('groups timeline items by date and supports expanding a date group', () => {
    const grouped = groupTimelineItems(
      [
        { id: 'a', tab: 'status', timestamp: 1779940860000, dateLabel: '2026-05-28', timeLabel: '12:01:00', title: '第二条', badgeLabel: '在线', resultTone: 'success', detailRows: [], raw: {} },
        { id: 'b', tab: 'status', timestamp: 1779940800000, dateLabel: '2026-05-28', timeLabel: '12:00:00', title: '第一条', badgeLabel: '离线', resultTone: 'danger', detailRows: [], raw: {} },
      ],
      { '2026-05-28': true },
    );

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.hiddenCount).toBe(0);
    expect(grouped[0]?.visibleItems.map((item) => item.id)).toEqual(['a', 'b']);
  });
});

it('异常属性保留质量与接收时间，零值不会丢失', () => {
  const bad = normalizePropertyLog({ dataID: 'temperature', dataName: '温度', value: null, timestamp: '1789516800000', quality: 'BAD', receivedTime: 1789516800120 });
  expect(bad.badgeLabel).toBe('异常');
  expect(bad.resultTone).toBe('danger');
  expect(bad.subtitle).toContain('数据不可用');
  expect(bad.detailRows.find((row) => row.label === '接收时间')?.value).toMatch(/\.120$/);
  const good = normalizePropertyLog({ dataID: 'temperature', dataName: '温度', value: '0', timestamp: '1789516800000', quality: 'GOOD', receivedTime: 0 });
  expect(good.subtitle).toContain('值：0');
  expect(good.detailRows.find((row) => row.label === '接收时间')?.value).toBe('—');
});

/** 验证新版毫秒数字合同与历史零值不会改变日志质量或显示纪元时间。 */
it('数字接收时间保留毫秒，历史零值显示未知且不影响质量', () => {
  const latest = normalizePropertyLog({ dataID: 'temperature', value: '26.5', timestamp: '1789516800000', quality: 'GOOD', receivedTime: 1789516800120 });
  expect(latest.detailRows.find((row) => row.label === '接收时间')?.value).toMatch(/\.120$/);
  const historical = normalizePropertyLog({ dataID: 'temperature', value: '0', timestamp: '1789516800000', receivedTime: 0 });
  expect(historical.detailRows.find((row) => row.label === '接收时间')?.value).toBe('—');
  expect(historical.badgeLabel).toBe('良好');
  expect(historical.subtitle).toContain('值：0');
});
