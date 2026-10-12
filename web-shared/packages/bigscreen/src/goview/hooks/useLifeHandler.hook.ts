import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import { EventLife } from '@/enums/eventEnum';
import { isUnsafeDynamicJsAllowed, warnDynamicJsBlocked } from '@app/shared/dynamic-js-policy';

const components: Record<string, any> = {};

// 事件脚本可用的 npm 包：key 固定（高级事件配置界面按 key 展示可用包标签），
// 值在脚本首次执行时才动态加载，避免全量 echarts 进入静态依赖链被首屏/大屏编辑器连带加载。
export const npmPkgs: Record<string, any> = { echarts: undefined };

// 懒加载事件脚本依赖的 npm 包；加载结果缓存在 npmPkgs 中，后续调用同步命中缓存。
async function loadNpmPkgs(): Promise<Record<string, any>> {
  if (npmPkgs.echarts === undefined) {
    npmPkgs.echarts = await import('echarts');
  }
  return npmPkgs;
}

export const useLifeHandler = (chartConfig: CreateComponentGroupType | CreateComponentType) => {
  if (!chartConfig.events) return {};

  const baseEvent: Record<string, any> = {};
  for (const key in chartConfig.events.baseEvent) {
    const fnStr: string | undefined = (chartConfig.events.baseEvent as any)[key];
    if (fnStr) {
      baseEvent[key] = generateBaseFunc(fnStr);
    }
  }

  const events = chartConfig.events.advancedEvents || {};
  const lifeEvents = {
    [EventLife.VNODE_BEFORE_MOUNT](e: any) {
      components[chartConfig.id] = e.component;
      const fnStr = (events[EventLife.VNODE_BEFORE_MOUNT] || '').trim();
      generateFunc(fnStr, e);
    },
    [EventLife.VNODE_MOUNTED](e: any) {
      const fnStr = (events[EventLife.VNODE_MOUNTED] || '').trim();
      generateFunc(fnStr, e);
    },
  };

  return { ...baseEvent, ...lifeEvents };
};

export function generateBaseFunc(fnStr: string) {
  try {
    if (!isUnsafeDynamicJsAllowed()) {
      warnDynamicJsBlocked('generateBaseFunc');
      return undefined;
    }

    return new Function(`
      return (
        async function(components, mouseEvent) {
          ${fnStr}
        }
      )`)().bind(undefined, components);
  } catch (error) {
    console.error('[useLifeHandler] 基础事件脚本执行失败:', error);
    return undefined;
  }
}

async function generateFunc(fnStr: string, e: any) {
  if (!isUnsafeDynamicJsAllowed()) {
    warnDynamicJsBlocked('generateFunc');
    return;
  }

  try {
    // 脚本执行前确保懒加载的 npm 包就绪，保证解构出的 echarts 等可用。
    const pkgs = await loadNpmPkgs();
    Function(`
      "use strict";
      return (
        async function(e, components, node_modules) {
          const { ${Object.keys(npmPkgs).join(', ')} } = node_modules;
          ${fnStr}
        }
      )`)().bind(e?.component)(e, components, pkgs);
  } catch (error) {
    console.error('[useLifeHandler] 生命周期脚本执行失败:', error);
  }
}
