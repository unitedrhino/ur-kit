import { ACCESS_TOKEN_KEY } from '@vben/saas';
import { useAccessStore } from '@vben/stores';

import { useCookies } from '@vueuse/integrations/useCookies';

export function getCookieValue(key: string, doNotParse = true): null | string {
  const cookies = useCookies([key], doNotParse ? { doNotParse: true } : undefined);
  return cookies.get(key) || null;
}

export function restoreAccessTokenFromCookie(logPrefix?: string): string {
  try {
    const token = getCookieValue(ACCESS_TOKEN_KEY, true) || '';
    if (!token) return '';

    try {
      useAccessStore().setAccessToken(token);
    } catch (error) {
      if (logPrefix) {
        console.warn(`[${logPrefix}] Failed to sync token to store:`, error);
      }
    }

    return token;
  } catch (error) {
    if (logPrefix) {
      console.warn(`[${logPrefix}] Failed to restore token from cookie:`, error);
    }
    return '';
  }
}
