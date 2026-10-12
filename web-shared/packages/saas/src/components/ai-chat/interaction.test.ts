/** 文件说明：验证结果映射保留缺失值、严格引用，以及报告不会执行或加载外部内容。 */
import { describe, expect, it } from 'vitest';
import { chartData, parseInteractionReference } from './interaction';
import { reportMarkdown } from './report-markdown';

describe('结构化结果协议', () => {
  it('真实零值与缺失值保持区别，数值字符串不能冒充统计数值', () => {
    const mapped = chartData({ id: 'chart', type: 'chart', xField: 'date', series: [{ name: '温度', yField: 'value' }] }, [
      { date: '1', value: 0 }, { date: '2', value: null }, { date: '3', value: '3' }, { date: '4', value: 12 },
    ]);
    expect(mapped.series[0]?.data).toEqual([0, null, null, 12]);
  });
  it('拒绝未知协议和不完整引用', () => {
    expect(parseInteractionReference({ schemaVersion: '2.0' })).toBeUndefined();
    expect(parseInteractionReference({ resultID: 'only' })).toBeUndefined();
    expect(parseInteractionReference({ schemaVersion: '1.0', resultID: 'r', sessionID: 's', messageID: 'm', toolCallID: 't', turnIndex: 1 })).toMatchObject({ resultID: 'r' });
  });
  it('报告保留 Markdown 但不会执行原始 HTML 或自动加载远程媒体', () => {
    const node = document.createElement('div');
    node.innerHTML = reportMarkdown('**统计说明**\n\n<script>alert(1)</script>\n<img src="https://example.com/track" onerror="alert(1)">\n\n![外链](https://example.com/track)\n\n[链接](javascript:alert(1))');
    expect(node.querySelector('strong')?.textContent).toBe('统计说明');
    expect(node.querySelector('script,img,iframe,video')).toBeNull();
    expect(node.querySelector('[href^="javascript:"]')).toBeNull();
  });
});
