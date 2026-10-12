/** 文件说明：验证共享图表工具只生成受控结构化结果，并拒绝无效或伪造配置。 */
import { describe, expect, it } from 'vitest';
import { sharedChatTools } from './business-tools';

const chartTool = sharedChatTools.find((tool) => tool.definition.name === 'render_data_chart')!;

/** chartArgs 生成最小合法参数，便于各图表类型复用校验。 */
function chartArgs(chartType: 'bar' | 'line' | 'pie' = 'line') {
  return {
    title: '产品创建趋势',
    chartType,
    categoryLabel: '创建时间',
    valueLabel: '产品数量',
    unit: '个',
    sourceTool: 'ur_api__api',
    sourceDescription: '当前权限范围，按创建日期统计，UTC',
    labels: ['2026-09-17', '2026-09-18'],
    values: [3, 5],
  };
}

describe('通用结构化图表工具', () => {
  it('生成图表和同源明细表，不接受任意 ECharts 配置', async () => {
    const result: any = await chartTool.execute(JSON.stringify(chartArgs()), new AbortController().signal);
    expect(result.interaction.blocks).toEqual([
      expect.objectContaining({ type: 'chart', chartType: 'line', datasetID: 'chart-data' }),
      expect.objectContaining({ type: 'table', datasetID: 'chart-data' }),
    ]);
    expect(result.interaction.datasets[0].rows).toEqual([
      { category: '2026-09-17', value: 3 },
      { category: '2026-09-18', value: 5 },
    ]);
    expect(result.interaction.source.description).toContain('系统仅校验结构和数值类型');
  });

  it('拒绝饼图负数、重复分类和未知配置字段', async () => {
    await expect(chartTool.execute(JSON.stringify({ ...chartArgs('pie'), labels: ['A'], values: [-1] }), new AbortController().signal)).rejects.toThrow('不能包含负数');
    await expect(chartTool.execute(JSON.stringify({ ...chartArgs('pie'), labels: ['A', 'A'], values: [1, 2] }), new AbortController().signal)).rejects.toThrow('不能重复');
    await expect(chartTool.execute(JSON.stringify({ ...chartArgs(), echartsOption: { tooltip: {} } }), new AbortController().signal)).rejects.toThrow('参数无效');
  });

  it('拒绝非有限数值和冒充自身来源', async () => {
    await expect(chartTool.execute(JSON.stringify({ ...chartArgs(), labels: ['A'], values: ['3'] }), new AbortController().signal)).rejects.toThrow('标签或数值无效');
    await expect(chartTool.execute(JSON.stringify({ ...chartArgs(), sourceTool: 'render_data_chart' }), new AbortController().signal)).rejects.toThrow('来源工具无效');
  });
});
