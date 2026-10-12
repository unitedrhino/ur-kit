/** 文件说明：共享聊天结构化结果 v1 类型与纯数据映射，不接受模型生成的组件或脚本。 */
import { $t } from '@vben/saas/locales';

/** 已保存结果的长期引用；业务数据始终通过鉴权接口读取。 */
export interface InteractionReference {
  schemaVersion: '1.0';
  resultID: string;
  sessionID: string;
  messageID: string;
  turnIndex: number;
  toolCallID: string;
}

/** 数据单元格只允许标量和显式缺失值。 */
export type Cell = string | number | boolean | null;

/** 数据列及计量口径。 */
export interface InteractionField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'datetime';
  unit?: string;
}

/** 数据集预览，totalRows 保留完整快照行数。 */
export interface InteractionDataset {
  id: string;
  fields: InteractionField[];
  rows: Record<string, Cell>[];
  totalRows: number;
  sampled: boolean;
  originalRowCount: number;
}

/** 服务端校验后的内容块定义。 */
export interface InteractionBlock {
  /** 已登记的私有附件，渲染时重新鉴权。 */
  artifactID?: string;
  id: string;
  type: 'markdown' | 'metric' | 'chart' | 'table' | 'image' | 'video' | 'file';
  title?: string;
  text?: string;
  datasetID?: string;
  rowIndex?: number;
  valueField?: string;
  unit?: string;
  description?: string;
  chartType?: 'line' | 'bar' | 'pie';
  xField?: string;
  series?: Array<{ name: string; yField: string }>;
  columns?: string[];
}

/** 快照预览对象。 */
export interface ChatInteractionResult extends InteractionReference {
  title: string;
  blocks: InteractionBlock[];
  datasets: InteractionDataset[];
  source: { toolName: string; resourceType: string; timeZone: string; description: string; query: Record<string, unknown> };
  generatedAt: string;
  snapshotHash: string;
  warnings?: string[];
}

/** 保留 null；缺失数据不可转换为零或正常状态。 */
export function chartData(block: InteractionBlock, rows: Record<string, Cell>[]) {
  return {
    xAxis: rows.map((row) => String(row[block.xField ?? ''] ?? $t('aiChat.ui.missingValue'))),
    series: (block.series ?? []).map((series) => ({
      name: series.name,
      data: rows.map((row) => {
        const value = row[series.yField];
        return typeof value === 'number' && Number.isFinite(value) ? value : null;
      }),
    })),
  };
}

/** SSE 仅接收 v1 的完整引用；数据对象不能冒充结果 ID。 */
export function parseInteractionReference(value: unknown): InteractionReference | undefined {
  if (!value || typeof value !== 'object') return;
  const ref = value as InteractionReference;
  if (ref.schemaVersion !== '1.0' || !Number.isInteger(ref.turnIndex)) return;
  if (![ref.resultID, ref.sessionID, ref.messageID, ref.toolCallID].every((id) => typeof id === 'string' && id.length > 0 && id.length <= 100)) return;
  return ref;
}

/** 当前内容块的继续提问引用，身份与快照由服务端重新校验。 */
export interface ResultFollowUp { resultID: string; blockID: string; title: string; selection: string; }
