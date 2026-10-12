/**
 * 文件说明：帮助中心内容注册表。
 * 以模块级 shallowRef 保存各应用注册的 HelpCenterContent：
 * - 应用在 bootstrap 阶段调用 setHelpCenterContent 注入内容
 * - 壳层 HelpCenterButton 通过 useHelpCenterContent 判断是否渲染入口
 * 未注册内容时帮助入口不渲染，其他应用零影响。
 */
import { shallowRef } from 'vue';

import type { HelpCenterContent } from './types';

/** 当前应用的帮助中心内容；null 表示未注册（不渲染帮助入口） */
const contentRef = shallowRef<HelpCenterContent | null>(null);

/**
 * 注册（或清除）当前应用的帮助中心内容
 * @param content 帮助内容；传 null 可清除
 */
export function setHelpCenterContent(content: HelpCenterContent | null) {
  contentRef.value = content;
}

/**
 * 获取帮助中心内容的只读引用
 * @returns shallowRef<HelpCenterContent | null>
 */
export function useHelpCenterContent() {
  return contentRef;
}
