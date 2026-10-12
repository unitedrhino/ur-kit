/**
 * 文件说明：帮助中心类型定义。
 * 各业务应用（如 iot）通过 setHelpCenterContent 注册自己的帮助内容，
 * 共享壳层 basic.vue 据此在头部右侧渲染问号帮助入口；未注册的应用完全不渲染，零影响。
 */

/** 帮助目录条目：route 为应用内跳转，href 为外部文档链接，二者至少提供一个 */
export interface HelpMenuItem {
  /** 条目名称 */
  label: string;
  /** 一句话说明（可选） */
  description?: string;
  /** 应用内路由地址 */
  route?: string;
  /** 外部文档链接（新窗口打开） */
  href?: string;
}

/** 帮助目录分组（对应一组业务菜单/主题） */
export interface HelpMenuGroup {
  /** 分组标题 */
  title: string;
  /** 分组下的条目列表 */
  items: HelpMenuItem[];
}

/** 应用注册的帮助中心内容 */
export interface HelpCenterContent {
  /** 新手引导页路由（面板顶部大入口跳转目标） */
  onboardingRoute: string;
  /** 新手引导入口标题，缺省为「新手引导」 */
  onboardingLabel?: string;
  /** 新手引导入口描述，缺省为通用文案 */
  onboardingDescription?: string;
  /** 教程目录分组 */
  menuGroups: HelpMenuGroup[];
  /** 官网文档站地址（面板底部外链，可选） */
  docSiteUrl?: string;
  /** 问题反馈链接（面板底部外链，可选） */
  feedbackUrl?: string;
}

/** 页面教程中的可复制参数行 */
export interface GuideParam {
  /** 参数名称 */
  label: string;
  /** 参数值（支持模板占位） */
  value: string;
  /** 参数说明（可选） */
  desc?: string;
}

/** 教程代码块（可复制） */
export interface GuideCodeBlock {
  /** 语言标签（显示用，如 go / json / text） */
  lang: string;
  /** 代码块标题（可选） */
  title?: string;
  /** 代码原文 */
  content: string;
}

/** 教程字段对照表 */
export interface GuideTable {
  /** 表头 */
  headers: string[];
  /** 行数据（与表头一一对应） */
  rows: string[][];
}

/** 教程深度小节：说明列表 / 对照表 / 代码案例，按需组合 */
export interface GuideSection {
  /** 小节标题 */
  title: string;
  /** 说明要点（可选） */
  points?: string[];
  /** 字段/枚举对照表（可选） */
  table?: GuideTable;
  /** 代码案例（可选） */
  code?: GuideCodeBlock;
}

/** 菜单页教程内容（应用通过 registerPageGuides 注册，页面上的 PageGuideButton 按 key 读取） */
export interface PageGuide {
  /** 教程标题（默认取菜单名） */
  title: string;
  /** 一句话说明本页用途 */
  summary: string;
  /** 流程/要点说明（按序渲染） */
  points: string[];
  /** 深度小节：脚本编写详解、字段对照表、代码案例等（可选，渲染在要点之后） */
  sections?: GuideSection[];
  /** 需要直接展示给用户的参数（可选） */
  params?: GuideParam[];
  /** 下一步引导（流程打通：跳转到流程中的下一个菜单） */
  next?: { label: string; route: string };
  /** 官网完整教程链接 */
  docUrl?: string;
}
