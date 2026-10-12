/**
 * 品牌与法律文档统一配置 —— 客户/平台定制时只改本文件
 *
 * 提供两套出口：
 *   - BRAND_CONFIG：服务/工具层使用（隐私弹窗 fallback、权限预热开关）
 *   - BRAND / LEGAL_DOCS / findLegalDoc：UI 层使用（登录页品牌承接 + 协议跳转）
 *
 * legal 子页路径：/packageUser/pages/legal/index?key=<doc.key>
 */

/* ======================== 服务/工具层使用的配置 ======================== */

export const BRAND_CONFIG = {
  privacyPopup: {
    /** 当 uni.getPrivacySetting 没拿到 privacyContractName 时的兜底协议名 */
    fallbackContractName: '《用户隐私保护指引》',
  },
  permissionWarmup: {
    afterLogin: {
      location: false,
      bluetooth: false,
    },
    roomCreate: {
      location: false,
    },
  },
} as const;

/* ======================== UI 层使用的配置 ======================== */

export const BRAND = {
  /** 一级页导航栏品牌名 */
  brandName: '联犀',
  appName: '联犀Iot',
  appSlogan: '一个 App 管理你的智能设备',
  /** Logo 图资源路径，留空则登录页用文字占位 */
  logoPath: '/static/lianxi.png',
} as const;

export type LegalDocKey = 'privacy-policy' | 'user-service-agreement' | 'third-party-share';

export interface LegalDoc {
  /** 路由参数 key */
  key: LegalDocKey;
  /** 用户可见标题 */
  title: string;
  /** 真实 URL */
  url: string;
}

export const LEGAL_DOCS: readonly LegalDoc[] = [
  {
    key: 'privacy-policy',
    title: '用户隐私保护指引',
    url: 'https://yunsunai.net/app/static/tmp/privacy-policy-yunsun.html?v=20260519',
  },
  {
    key: 'user-service-agreement',
    title: '用户服务协议',
    url: 'https://yunsunai.net/app/static/tmp/user-service-agreement-yunsun.html',
  },
  {
    key: 'third-party-share',
    title: '第三方信息共享清单',
    url: 'https://yunsunai.net/app/static/tmp/third-party-info-sharing-list-yunsun.html',
  },
];

export function findLegalDoc(key: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((item) => item.key === key);
}
