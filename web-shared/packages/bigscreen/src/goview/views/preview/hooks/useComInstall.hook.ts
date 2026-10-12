import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import type { ChartEditStorageType } from '../index.type';

import { nextTick, ref } from 'vue';

import { fetchChartComponent } from '@/packages/index';
import { waitForGoviewApp } from '@/utils/appInstance';

import { markPreviewRuntimeSettled } from '../utils/runtime';

// 强制浏览器重绘 + 触发 resize
const forceRepaint = () => {
  // 读取 offsetHeight 强制 reflow
  void document.body.offsetHeight;
  window.dispatchEvent(new Event('resize'));
};

export const useComInstall = (localStorageInfo: ChartEditStorageType) => {
  const show = ref(false);

  // 注册组件并显示预览
  // 使用 async IIFE + 等待应用实例就绪，避免 setInterval 在后台标签页被节流（最低 ~1000ms）
  // 正常情况下 mount.ts 在 app.mount() 前已设置实例引用，此处可立即执行
  const initPreview = async () => {
    // 等待应用实例就绪（兜底：若尚未赋值则用间隔轮询）
    const app = await waitForGoviewApp();

    const intComponent = (target: CreateComponentType) => {
      if (!app.component(target.chartConfig.chartKey)) {
        app.component(target.chartConfig.chartKey, fetchChartComponent(target.chartConfig));
      }
    };

    localStorageInfo.componentList.forEach((e: CreateComponentGroupType | CreateComponentType) => {
      if (e.isGroup) {
        (e as CreateComponentGroupType).groupList.forEach((groupItem) => {
          intComponent(groupItem);
        });
      } else {
        intComponent(e as CreateComponentType);
      }
    });

    show.value = true;
    markPreviewRuntimeSettled();

    // 执行一批延迟递增的 forceRepaint，覆盖各图表库初始化完成的时间窗口
    const scheduleRepaints = () => {
      nextTick(() => {
        forceRepaint();
        markPreviewRuntimeSettled();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            forceRepaint();
            markPreviewRuntimeSettled();
          });
        });
      });
      [300, 600, 1000, 1500, 2500].forEach((delay) =>
        setTimeout(() => {
          forceRepaint();
          markPreviewRuntimeSettled();
        }, delay),
      );
    };

    if (document.visibilityState === 'visible') {
      // Tab 已在前台：立即开始调度
      scheduleRepaints();
    } else {
      // Tab 在后台：等到第一次切到前台再调度，避免浏览器节流导致信号丢失
      const onFirstVisible = () => {
        if (document.visibilityState === 'visible') {
          scheduleRepaints();
          document.removeEventListener('visibilitychange', onFirstVisible);
        }
      };
      document.addEventListener('visibilitychange', onFirstVisible);
    }
  };

  initPreview();

  return {
    show,
  };
};
