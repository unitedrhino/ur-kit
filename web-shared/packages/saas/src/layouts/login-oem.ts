/** 登录页 OEM 配置解析：保留自定义内容，缺省文案跟随当前界面语言。 */
import defaultSloganSvg from '../assets/images/default-slogan.svg';
import dataDashboardSlogan from '../assets/images/login-slogans/data-dashboard.webp';
import deviceCloudSlogan from '../assets/images/login-slogans/device-cloud.webp';
import { $t } from '../locales';

export type LoginSloganImageType = 'template' | 'upload';

export interface LoginOemConfig {
  title: string;
  loginPageTitle: string;
  loginPageDescription: string;
  loginFormTitle: string;
  loginFormDescription: string;
  sloganImageType: LoginSloganImageType;
  sloganImageTemplate: string;
  sloganImage: string;
}

export interface LoginSloganTemplate {
  description: string;
  image: string;
  label: string;
  value: string;
}

export const LOGIN_OEM_DEFAULTS: LoginOemConfig = {
  loginFormDescription: '请输入您的帐户信息以开始管理您的项目',
  loginFormTitle: '欢迎回来 👋🏻',
  loginPageDescription: '联犀物联网平台，开箱即用的物联网系统',
  loginPageTitle: '联犀物联网平台',
  sloganImage: '',
  sloganImageTemplate: 'iot-platform',
  sloganImageType: 'template',
  title: '联犀',
};

export const LOGIN_SLOGAN_TEMPLATES: LoginSloganTemplate[] = [
  {
    description: '当前默认物联网平台插画',
    image: defaultSloganSvg,
    label: 'IoT 平台',
    value: 'iot-platform',
  },
  {
    description: '设备、边缘网关和云端连接',
    image: deviceCloudSlogan,
    label: '设备云平台',
    value: 'device-cloud',
  },
  {
    description: '数据看板、指标卡片和设备状态',
    image: dataDashboardSlogan,
    label: '数据看板',
    value: 'data-dashboard',
  },
];

const LOGIN_SLOGAN_TEMPLATE_MAP = new Map(
  LOGIN_SLOGAN_TEMPLATES.map((template) => [template.value, template.image]),
);

function textOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function sloganImageTypeOrFallback(value: unknown): LoginSloganImageType {
  return value === 'upload' ? 'upload' : 'template';
}

/**
 * 解析登录页 OEM 配置；未配置的四段可见文案按当前语言回退。
 * @param oem 平台配置的 OEM 文案与插画选项
 * @returns 用于认证布局和登录表单的完整配置
 */
export function resolveLoginOemConfig(oem?: Partial<LoginOemConfig> | null): LoginOemConfig {
  const sloganImageType = sloganImageTypeOrFallback(oem?.sloganImageType);

  return {
    loginFormDescription: textOrFallback(oem?.loginFormDescription, $t('authOem.loginFormDescription')),
    loginFormTitle: textOrFallback(oem?.loginFormTitle, $t('authOem.loginFormTitle')),
    loginPageDescription: textOrFallback(oem?.loginPageDescription, $t('authOem.loginPageDescription')),
    loginPageTitle: textOrFallback(oem?.loginPageTitle, $t('authOem.loginPageTitle')),
    sloganImage: textOrFallback(oem?.sloganImage, ''),
    sloganImageTemplate: textOrFallback(oem?.sloganImageTemplate, LOGIN_OEM_DEFAULTS.sloganImageTemplate),
    sloganImageType,
    title: textOrFallback(oem?.title, LOGIN_OEM_DEFAULTS.title),
  };
}

export function resolveSloganImage(oem?: Partial<LoginOemConfig> | null): string {
  const config = resolveLoginOemConfig(oem);
  if (config.sloganImageType === 'upload' && config.sloganImage) {
    return config.sloganImage;
  }
  return LOGIN_SLOGAN_TEMPLATE_MAP.get(config.sloganImageTemplate) || defaultSloganSvg;
}
