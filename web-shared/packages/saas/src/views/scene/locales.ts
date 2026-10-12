/** 文件说明：将场景页路由传入的语言键解析为当前界面的可见文案。 */
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { reactive, watch } from 'vue';

/** sceneText 在渲染时按当前语言解析已本地化的场景页配置文案。 */
export function sceneText(value?: string): string {
  void preferences.app.locale;
  if (!value) return '';
  return /^[\w-]+(?:\.[\w-]+)+$/.test(value) ? $t(value) : value;
}

/** localizedSceneState 保持场景表单选项引用，并在语言变化时刷新其译文。 */
export function localizedSceneState<T extends object>(factory: () => T): T {
  const state = reactive(factory()) as T;
  watch(() => preferences.app.locale, () => {
    const next = factory();
    if (Array.isArray(state) && Array.isArray(next)) {
      state.splice(0, state.length, ...next);
    } else {
      Object.assign(state, next);
    }
  }, { flush: 'sync' });
  return state;
}
