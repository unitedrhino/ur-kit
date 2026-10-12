/**
 * 文件说明：帮助中心共享模块入口。
 * 应用侧通过 `@vben/saas/help-center` 注册内容（setHelpCenterContent / registerPageGuides）：
 * - 壳层 basic.vue（或 console-v3 等自绘布局）中的 HelpCenterButton 依据注册内容渲染帮助入口
 * - 各业务页面挂 PageGuideButton，按 guideKey 渲染对应教程抽屉
 */
import HelpCenterButton from './HelpCenterButton.vue';
import PageGuideButton from './PageGuideButton.vue';
import { getPageGuide, registerPageGuides, usePageGuides } from './page-guide-registry';
import { setHelpCenterContent, useHelpCenterContent } from './registry';

// vue-tsc 对 .vue 文件仅识别默认导出，此处以默认导入+统一重导出的方式供应用使用
export { HelpCenterButton, PageGuideButton };
export { getPageGuide, registerPageGuides, usePageGuides };
export { setHelpCenterContent, useHelpCenterContent };
export type {
  GuideCodeBlock,
  GuideParam,
  GuideSection,
  GuideTable,
  HelpCenterContent,
  HelpMenuGroup,
  HelpMenuItem,
  PageGuide,
} from './types';
