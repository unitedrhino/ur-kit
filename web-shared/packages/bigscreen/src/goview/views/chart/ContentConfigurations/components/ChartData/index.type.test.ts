/** 文件说明：请求与时间线枚举兼容回归，语言切换只修改展示标签。 */
import { i18n } from '@vben/saas/locales';
import editorEn from '../../../../../../../../saas/src/locales/langs/en-US/bigscreenEditor.json';
import editorZh from '../../../../../../../../saas/src/locales/langs/zh-CN/bigscreenEditor.json';
import { expect, it } from 'vitest';
import { SelectCreateDataEnum, TimelineTitleEnum, TimelineTitleLabels } from './index.type';

it('保留历史枚举值，按当前语言读取时间线标题', () => {
  const previousLocale = i18n.global.locale.value;
  const previousEn = i18n.global.getLocaleMessage('en-US');
  const previousZh = i18n.global.getLocaleMessage('zh-CN');
  try {
    i18n.global.setLocaleMessage('en-US', { bigscreenEditor: editorEn });
    i18n.global.setLocaleMessage('zh-CN', { bigscreenEditor: editorZh });
    i18n.global.locale.value = 'en-US';
    expect(TimelineTitleLabels.CONTENT).toBe(editorEn.ui.dataContent);
    expect(TimelineTitleEnum.CONTENT).toBe('数据内容');
    expect(SelectCreateDataEnum.STATIC).toBe('静态数据');
    i18n.global.locale.value = 'zh-CN';
    expect(TimelineTitleLabels.CONTENT).toBe('数据内容');
    expect(TimelineTitleEnum.CONTENT).toBe('数据内容');
    expect(SelectCreateDataEnum.STATIC).toBe('静态数据');
  } finally {
    i18n.global.setLocaleMessage('en-US', previousEn);
    i18n.global.setLocaleMessage('zh-CN', previousZh);
    i18n.global.locale.value = previousLocale;
  }
});
