import type { Preferences } from '@vben/preferences';

import { preferences, updatePreferences } from '@vben/preferences';
import { useSessionStore } from '@vben/saas';
import { buildSharedAppNamespace, useAccessStore } from '@vben/stores';

import { getCookieValue, restoreAccessTokenFromCookie } from '../../../shared/auth';

const ORG_ID_KEY = 'org-id';

function getPreferenceStorageKey() {
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const namespace = buildSharedAppNamespace({
    appName: import.meta.env.VITE_GLOB_APPNAME,
    appVersion: import.meta.env.VITE_APP_VERSION,
    env,
    namespace: import.meta.env.VITE_APP_NAMESPACE,
  });
  return `${namespace}-preferences`;
}

function parsePreferenceStorageValue(raw: null | string): null | Preferences {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { value?: Preferences };
    return parsed?.value || null;
  } catch {
    return null;
  }
}

function syncStandalonePreferences() {
  const storedPreferences = parsePreferenceStorageValue(localStorage.getItem(getPreferenceStorageKey()));
  if (!storedPreferences) return;

  const updates: Partial<Preferences> = {};

  if (JSON.stringify(storedPreferences.theme || {}) !== JSON.stringify(preferences.theme || {})) {
    updates.theme = storedPreferences.theme;
  }

  if (storedPreferences.app?.locale && storedPreferences.app.locale !== preferences.app.locale) {
    updates.app = {
      locale: storedPreferences.app.locale,
    } as Preferences['app'];
  }

  if (Object.keys(updates).length > 0) {
    updatePreferences(updates);
  }
}

function syncStandaloneSession() {
  restoreAccessTokenFromCookie('Standalone Bigscreen');

  const tenantCode = getCookieValue(ORG_ID_KEY, true) || '';
  if (!tenantCode) return;

  const sessionStore = useSessionStore();
  if (sessionStore.tenantCode !== tenantCode) {
    sessionStore.setTenant(tenantCode);
  }
}

function syncStandaloneAccessStore() {
  const token = restoreAccessTokenFromCookie('Standalone Bigscreen');
  if (!token) return;

  const accessStore = useAccessStore();
  if (!accessStore.accessToken) {
    accessStore.setAccessToken(token);
  }
}

export function syncStandaloneContext() {
  syncStandalonePreferences();
  syncStandaloneSession();
  syncStandaloneAccessStore();
}
