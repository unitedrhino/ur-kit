import type { CoreApi } from '@vben/api';

type RegisterChannel = 'email' | 'phone';

export function supportsRegisterChannel(appInfo: CoreApi.AppInfo | null | undefined, channel: RegisterChannel) {
  if (!appInfo) {
    return false;
  }

  const { loginTypes } = appInfo;

  if (!Array.isArray(loginTypes) || loginTypes.length === 0) {
    return true;
  }

  return loginTypes.includes(channel);
}

export function canShowRegisterEntry(appInfo: CoreApi.AppInfo | null | undefined) {
  return appInfo?.useBy === 'client' && (supportsRegisterChannel(appInfo, 'email') || supportsRegisterChannel(appInfo, 'phone'));
}
