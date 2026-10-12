/**
 * 全局 AI 助手面板状态（模块级单例）。
 *
 * 设计目的：
 * - 面板挂载点位于最顶层布局（`layouts/basic.vue`），从整个浏览器最右侧滑入；
 * - 具体的业务页面（如场景编辑器）通过调用 `openSceneAi(ctx, sceneType, onApplied)`
 *   把当前编辑上下文交给全局面板；
 * - 面板关闭或页面卸载时调用 `closeSceneAi()` 清理。
 */

import { shallowRef, ref, type ShallowRef, type Ref } from 'vue';

import type { SceneType } from '../../scene-types';
import type { SceneDraftContext } from '../composables/useSceneDraft';

export const sceneAiOpen: Ref<boolean> = ref(false);
export const sceneAiCtx: ShallowRef<SceneDraftContext | null> = shallowRef(null);
export const sceneAiType: Ref<SceneType> = ref<SceneType>('auto');

/** 页面注册的"AI 成功应用补丁"回调（例如把名称标记为已自定义）。 */
export const sceneAiOnApplied: ShallowRef<(() => void) | null> = shallowRef(null);

export function openSceneAi(
  ctx: SceneDraftContext,
  sceneType: SceneType,
  onApplied?: () => void,
) {
  sceneAiCtx.value = ctx;
  sceneAiType.value = sceneType;
  sceneAiOnApplied.value = onApplied ?? null;
  sceneAiOpen.value = true;
}

export function closeSceneAi() {
  sceneAiOpen.value = false;
}

export function toggleSceneAi(
  ctx: SceneDraftContext,
  sceneType: SceneType,
  onApplied?: () => void,
) {
  if (sceneAiOpen.value) {
    closeSceneAi();
  } else {
    openSceneAi(ctx, sceneType, onApplied);
  }
}

/** 页面卸载时调用，避免残留引用导致内存泄漏 / 面板指向已销毁的 ctx。 */
export function resetSceneAi() {
  sceneAiOpen.value = false;
  sceneAiCtx.value = null;
  sceneAiOnApplied.value = null;
}
