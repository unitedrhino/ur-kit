/** 文件说明：应用注册业务查询工具；共享聊天只负责执行与回传，不理解业务字段。 */
import type { InjectionKey } from 'vue';
import type { ToolDef } from './api';
import { $t } from '@vben/saas/locales';

/** AiBusinessTool 由应用持有查询权限、真实数据接口和统计口径。 */
export interface AiBusinessTool {
  definition: ToolDef;
  execute: (argumentsJSON: string, signal: AbortSignal) => Promise<unknown>;
}

/** ChartPoint 是通用图表工具接受的最小数据单元，数值必须来自本轮已完成的业务查询。 */
interface ChartPoint { label: string; value: number; }

/** parseChartPoints 校验成对的标签和值，避免任意配置、非有限数值和超大快照进入渲染层。 */
function parseChartPoints(labelsValue: unknown, valuesValue: unknown, chartType: string): ChartPoint[] {
  if (!Array.isArray(labelsValue) || !Array.isArray(valuesValue) || labelsValue.length === 0 || labelsValue.length > 200 || labelsValue.length !== valuesValue.length) {
    throw new Error($t('aiChat.ui.chartPointLimit'));
  }
  const points = labelsValue.map((labelValue, index) => {
    const label = typeof labelValue === 'string' ? labelValue.trim() : '';
    const number = typeof valuesValue[index] === 'number' ? valuesValue[index] : Number.NaN;
    if (!label || label.length > 100 || !Number.isFinite(number)) throw new Error($t('aiChat.ui.invalidChartValue'));
    if (chartType === 'pie' && number < 0) throw new Error($t('aiChat.ui.negativePieValue'));
    return { label, value: number };
  });
  if (chartType === 'pie' && new Set(points.map((point) => point.label)).size !== points.length) {
    throw new Error($t('aiChat.ui.duplicatePieCategory'));
  }
  return points;
}

/** sharedChatTools 把本轮查询结果转换为受控图表；不接受 ECharts 配置、脚本或外部地址。 */
export const sharedChatTools: AiBusinessTool[] = [{
  definition: {
    name: 'render_data_chart',
    description: '把本轮已完成、但尚未包含 interaction 结构化结果的业务/API工具数值生成可交互折线图、柱状图或饼图，并同时保存明细表供历史恢复。如果业务工具结果已经包含 interaction 字段或已经展示可交互图表，禁止再次调用本工具，避免重复图表。其他情况下，回答中只要承诺展示图表或用户明确要求可视化，就必须调用本工具，不能用 Markdown 表格、文本点阵或代码块冒充图表。labels 与 values 必须按相同顺序逐项复制或聚合自本轮最近一次工具结果，禁止猜测、补齐或改写数值；一个图表调用一次，需要多个图表时分别调用。没有真实查询结果时不要调用。',
    parameters: {
      title: { type: 'string', description: '图表标题，须准确说明统计对象', required: true },
      chartType: { type: 'string', enum: ['line', 'bar', 'pie'], description: '趋势用 line，分类对比用 bar，占比用 pie', required: true },
      categoryLabel: { type: 'string', description: '横轴或分类字段名称，例如创建时间、产品品类', required: true },
      valueLabel: { type: 'string', description: '数值字段名称，例如产品数量', required: true },
      unit: { type: 'string', description: '数值单位；原查询没有单位时传空字符串', required: true },
      sourceTool: { type: 'string', description: '产生这些数值的本轮业务工具名称', required: true },
      sourceDescription: { type: 'string', description: '查询范围、聚合方法、时区及截断情况；不得声称未验证的口径', required: true },
      labels: {
        type: 'array',
        description: '按展示顺序排列的分类或时间标签；时间标签应保留原结果提供的日期或时区',
        required: true,
        items: { type: 'string', description: '分类或时间标签' },
      },
      values: {
        type: 'array',
        description: '与 labels 一一对应的有限数值，缺失值不能写成 0',
        required: true,
        items: { type: 'number', description: '真实查询数值' },
      },
    },
  },
  async execute(argumentsJSON) {
    const input = JSON.parse(argumentsJSON || '{}') as Record<string, unknown>;
    const allowed = ['title', 'chartType', 'categoryLabel', 'valueLabel', 'unit', 'sourceTool', 'sourceDescription', 'labels', 'values'];
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !allowed.includes(key))) {
      throw new Error($t('aiChat.ui.invalidChartParameters'));
    }
    const text = (key: string, max: number, allowEmpty = false) => {
      const value = typeof input[key] === 'string' ? input[key].trim() : '';
      if ((!allowEmpty && !value) || value.length > max) throw new Error($t('aiChat.ui.invalidParameter', { key }));
      return value;
    };
    const title = text('title', 200);
    const chartType = text('chartType', 10);
    if (!['line', 'bar', 'pie'].includes(chartType)) throw new Error($t('aiChat.ui.unsupportedChartType'));
    const categoryLabel = text('categoryLabel', 100);
    const valueLabel = text('valueLabel', 100);
    const unit = text('unit', 30, true);
    const sourceTool = text('sourceTool', 100);
    if (!/^[\w:.-]+$/.test(sourceTool) || sourceTool === 'render_data_chart') throw new Error($t('aiChat.ui.invalidDataSourceTool'));
    const sourceDescription = text('sourceDescription', 500);
    const points = parseChartPoints(input.labels, input.values, chartType);
    const rows = points.map((point) => ({ category: point.label, value: point.value }));
    return {
      summary: $t('aiChat.ui.chartCreated', { tool: sourceTool, chart: $t(`aiChat.ui.${chartType === 'pie' ? 'pieChart' : chartType === 'bar' ? 'barChart' : 'lineChart'}`), count: rows.length }),
      interaction: {
        schemaVersion: '1.0',
        resultKey: 'rendered-data-chart',
        title,
        blocks: [
          { id: 'chart', type: 'chart', title, chartType, datasetID: 'chart-data', xField: 'category', series: [{ name: valueLabel, yField: 'value' }] },
          { id: 'details', type: 'table', title: $t('aiChat.ui.dataDetails'), datasetID: 'chart-data', columns: ['category', 'value'] },
        ],
        datasets: [{
          id: 'chart-data',
          fields: [
            { key: 'category', label: categoryLabel, type: 'string' },
            { key: 'value', label: valueLabel, type: 'number', unit },
          ],
          rows,
          totalRows: rows.length,
          sampled: false,
          originalRowCount: rows.length,
        }],
        source: {
          toolName: 'render_data_chart',
          resourceType: 'derived-query-chart',
          query: { sourceTool, chartType, pointCount: rows.length },
          timeZone: 'UTC',
          description: $t('aiChat.ui.chartSourceDescription', { description: sourceDescription, tool: sourceTool }),
        },
        warnings: [$t('aiChat.ui.chartMappingWarning')],
      },
    };
  },
}];
/** 应用在 bootstrap 注入自己的工具，未注入时保持已有聊天行为。 */
export const aiBusinessToolsKey: InjectionKey<AiBusinessTool[]> = Symbol('ai-business-tools');
