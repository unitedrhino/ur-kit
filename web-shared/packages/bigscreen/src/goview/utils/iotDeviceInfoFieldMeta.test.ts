/** 文件说明：设备信息显示翻译回归，验证语言刷新与业务字段、字典值保留。 */
import { i18n } from '@vben/saas/locales';
import iotEn from '../../../../saas/src/locales/langs/en-US/iotApp.json';
import iotZh from '../../../../saas/src/locales/langs/zh-CN/iotApp.json';
import { describe, expect, it, vi } from 'vitest';

/** 可变字典模拟服务端自定义网络名称，不触发外部 API。 */
const dictionary = vi.hoisted(() => ({ label: '有线网络' }));
vi.mock('@vben/saas', () => ({
  useDictStore: () => ({ getDictMap: () => [{ value: 8, label: dictionary.label }] }),
}));
import { getIoTDeviceInfoFieldLabel, getIoTDeviceInfoFieldSemanticValue } from './iotDeviceInfoFieldMeta';

describe('设备字段多语言展示', () => {
  it('语言刷新后更新标签和已知枚举，保留字段名与未知业务值', () => {
    const previousLocale = i18n.global.locale.value;
    const previousEn = i18n.global.getLocaleMessage('en-US');
    const previousZh = i18n.global.getLocaleMessage('zh-CN');
    try {
      i18n.global.setLocaleMessage('en-US', { iotApp: iotEn });
      i18n.global.setLocaleMessage('zh-CN', { iotApp: iotZh });
      i18n.global.locale.value = 'en-US';
      expect(getIoTDeviceInfoFieldLabel('deviceType')).toBe(iotEn.productPage.deviceType);
      expect(getIoTDeviceInfoFieldSemanticValue('deviceType', '2')).toBe(iotEn.devicePage.typeGateway);
      expect(getIoTDeviceInfoFieldSemanticValue('deviceType', 99)).toBe(99);
      expect(getIoTDeviceInfoFieldSemanticValue('deviceName', '业务设备一')).toBe('业务设备一');
      expect(getIoTDeviceInfoFieldLabel('customField')).toBe('customField');
      i18n.global.locale.value = 'zh-CN';
      expect(getIoTDeviceInfoFieldSemanticValue('deviceType', 2)).toBe('网关');
    } finally {
      i18n.global.setLocaleMessage('en-US', previousEn);
      i18n.global.setLocaleMessage('zh-CN', previousZh);
      i18n.global.locale.value = previousLocale;
    }
  });

  it('已知网络字典名称跟随语言，自定义字典名称保持原值', () => {
    const previousLocale = i18n.global.locale.value;
    const previousEn = i18n.global.getLocaleMessage('en-US');
    try {
      i18n.global.setLocaleMessage('en-US', { iotApp: iotEn });
      i18n.global.locale.value = 'en-US';
      dictionary.label = '有线网络';
      expect(getIoTDeviceInfoFieldSemanticValue('netType', 8)).toBe(iotEn.devicePage.ethernet);
      dictionary.label = '园区专用网络';
      expect(getIoTDeviceInfoFieldSemanticValue('netType', 8)).toBe('园区专用网络');
    } finally {
      dictionary.label = '有线网络';
      i18n.global.setLocaleMessage('en-US', previousEn);
      i18n.global.locale.value = previousLocale;
    }
  });
});
