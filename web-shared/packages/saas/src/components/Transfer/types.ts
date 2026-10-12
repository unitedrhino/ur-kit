export interface TransferOption {
  label: string;
  value: string;
  /** 副文案，如 "标识符: xxx" */
  description?: string;
}

export interface TransferProps {
  /** 源列表，同 NTransfer options */
  options: TransferOption[];
  /** 已选 value 列表，v-model */
  modelValue: string[];
  /** 左侧是否可搜索 */
  sourceFilterable?: boolean;
  /** 右侧是否可搜索 */
  targetFilterable?: boolean;
  /** 左侧标题 */
  sourceTitle?: string;
  /** 右侧标题 */
  targetTitle?: string;
  /** 搜索框 placeholder */
  filterPlaceholder?: string;
  /** 空列表文案 */
  emptyText?: string;
  /** 根节点 class */
  class?: string;
  /** 是否显示物模型类型筛选（types 多选） */
  showTypesFilter?: boolean;
  /** 选中的物模型类型，用于 API CommonSchemaGetListReq.types */
  typesFilter?: number[];
  /** 自定义物模型类型选项，可禁用特定类型 */
  typesFilterOptions?: { value: number; label: string; disabled?: boolean }[];
  /** 类型筛选是否允许多选，默认 true。false 时呈现单选样式 */
  typesFilterMultiple?: boolean;
  /**
   * 按哪个字段分组（如 "description" 表示按模块名分组）。
   * 设置后列表按组显示，每组标题可折叠，支持一键选中整组。
   */
  groupBy?: string;
}
