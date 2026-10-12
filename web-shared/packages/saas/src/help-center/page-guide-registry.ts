/**
 * 文件说明：页面教程内容注册表。
 * 各应用把自己的菜单页教程（Record<guideKey, PageGuide>）注册进来，
 * 页面上的 PageGuideButton 按 guideKey 读取渲染；未注册的 key 按钮不渲染，应用之间零影响。
 */
import { shallowRef } from 'vue';

import type { PageGuide } from './types';

/** guideKey → PageGuide 的注册表 */
const guidesRef = shallowRef<Record<string, PageGuide>>({});

/**
 * 批量注册页面教程（重复 key 以最后一次为准）
 * @param guides 页面教程集合
 */
export function registerPageGuides(guides: Record<string, PageGuide>) {
  guidesRef.value = { ...guidesRef.value, ...guides };
}

/**
 * 按 guideKey 读取页面教程
 * @returns 对应内容；未注册返回 undefined
 */
export function getPageGuide(key: string): PageGuide | undefined {
  return guidesRef.value[key];
}

/** 获取注册表只读引用（响应式） */
export function usePageGuides() {
  return guidesRef;
}
