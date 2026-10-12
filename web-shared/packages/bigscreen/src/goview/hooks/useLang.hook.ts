/** 文件说明：编辑器控件语言跟随后台偏好，复用统一组件库语言映射。 */
import { computed } from 'vue';
import { preferences } from '@vben/preferences';
import { naiveLocaleFor } from '@vben/saas/utils';

/** useLang 返回当前界面与日期控件语言，语言切换不重建画布。 */
export const useLang = () => {
  /** 共享组件库语言配置随宿主偏好更新。 */
  const config = computed(() => naiveLocaleFor(preferences.app.locale));
  return {
    locale: computed(() => config.value.locale),
    dateLocale: computed(() => config.value.dateLocale),
  };
};
