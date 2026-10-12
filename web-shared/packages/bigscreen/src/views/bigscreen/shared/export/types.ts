/**
 * 大屏导出 Schema 类型定义
 *
 * .goview.json 文件的信封格式，包装 ChartEditStorage 并附加版本号和元数据。
 */

/** 导出文件的顶层结构 */
export interface GoviewSchema {
  /** Schema 格式版本，语义化版本号（如 "1.0.0"） */
  version: string;
  /** 导出元数据 */
  meta: GoviewMeta;
  /** 画布配置（对应 ChartEditStorage.editCanvasConfig） */
  editCanvasConfig: Record<string, any>;
  /** 全局请求配置（对应 ChartEditStorage.requestGlobalConfig） */
  requestGlobalConfig: Record<string, any>;
  /** 组件列表（对应 ChartEditStorage.componentList） */
  componentList: any[];
}

/** 导出元数据 */
export interface GoviewMeta {
  /** 大屏名称（取自 editCanvasConfig.projectName） */
  name: string;
  /** 导出时间（ISO 8601） */
  exportedAt: string;
  /** 顶层组件数量 */
  componentCount: number;
  /** 封面图 Base64 data URL，跨环境导入时无需依赖 OSS */
  indexImage?: string;
}

/** 当前 Schema 版本 */
export const CURRENT_SCHEMA_VERSION = '1.1.0';

/** 导出选项 */
export interface ExportOptions {
  /** 背景图模式：url 保留原始 URL，base64 转为内嵌 data URL */
  bgImageMode?: 'url' | 'base64';
}
