import { APPS_DEV_HOST_MAP } from '@vben/saas/constants';

import { stripOrgPathPrefix } from '#/router/org-scope';

const PENDING_INVITE_CODE_KEY = 'saas:pending-invite-code';
const INVITE_RANDOM_LENGTH = 10;
const INVITE_METHOD_LENGTH = 1;
const INVITE_PATH = '/auth/invite';
const CONSOLE_APP_URL_KEY = '/app/console/';

type InviteStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

function getStorage(storage?: InviteStorage): InviteStorage | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function buildInviteLink(code: string, origin?: string) {
  if (origin) {
    const normalizedOrigin = origin.replace(/\/+$/, '');

    return `${normalizedOrigin}${INVITE_PATH}?code=${encodeURIComponent(code)}`;
  }

  const consoleBase = resolveConsoleAppBase();
  if (!consoleBase) {
    return `${INVITE_PATH}?code=${encodeURIComponent(code)}`;
  }

  const routePath = import.meta.env.VITE_ROUTER_HISTORY === 'hash' || consoleBase.includes(CONSOLE_APP_URL_KEY) ? `#${INVITE_PATH}` : INVITE_PATH;
  const normalizedBase = routePath.startsWith('#') ? consoleBase.replace(/\/?$/, '/') : consoleBase.replace(/\/+$/, '');

  return `${normalizedBase}${routePath}?code=${encodeURIComponent(code)}`;
}

function resolveConsoleAppBase() {
  if (typeof window === 'undefined') return '';

  if (import.meta.env.DEV) {
    const devHost = APPS_DEV_HOST_MAP.find((item) => item.appUrlKey === CONSOLE_APP_URL_KEY)?.appDevHost;
    if (devHost) {
      try {
        const target = new URL(devHost, window.location.origin);
        target.protocol = window.location.protocol;
        target.hostname = window.location.hostname;
        return target.toString();
      } catch {
        return devHost;
      }
    }
  }

  return new URL(CONSOLE_APP_URL_KEY, window.location.origin).toString();
}

export function savePendingInviteCode(code: string, storage?: InviteStorage) {
  const normalizedCode = code.trim();
  const target = getStorage(storage);
  if (!target || !normalizedCode) return;

  target.setItem(PENDING_INVITE_CODE_KEY, normalizedCode);
}

export function getPendingInviteCode(storage?: InviteStorage) {
  return getStorage(storage)?.getItem(PENDING_INVITE_CODE_KEY)?.trim() || '';
}

export function consumePendingInviteCode(storage?: InviteStorage) {
  const target = getStorage(storage);
  if (!target) return '';

  const code = getPendingInviteCode(target);
  if (code) {
    target.removeItem(PENDING_INVITE_CODE_KEY);
  }
  return code;
}

export function parseInviteTenantCode(code: string) {
  const normalizedCode = code.trim();
  const suffixLength = INVITE_RANDOM_LENGTH + INVITE_METHOD_LENGTH;
  if (normalizedCode.length <= suffixLength) return '';

  return normalizedCode.slice(0, -suffixLength);
}

export function normalizeInviteRedirectPath(raw: null | string | undefined) {
  let value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return '';

  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  if (value.startsWith(INVITE_PATH)) return value;

  const canonicalPath = stripOrgPathPrefix(value);
  if (!canonicalPath.startsWith(INVITE_PATH)) return '';
  return canonicalPath;
}

export function extractInviteCodeFromRedirect(raw: null | string | undefined) {
  const redirectPath = normalizeInviteRedirectPath(raw);
  if (!redirectPath) return '';

  const queryStart = redirectPath.indexOf('?');
  if (queryStart === -1) return '';

  const searchParams = new URLSearchParams(redirectPath.slice(queryStart + 1));
  return searchParams.get('code')?.trim() || '';
}
