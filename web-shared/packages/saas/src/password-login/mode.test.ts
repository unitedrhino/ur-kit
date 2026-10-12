/** 密码登录模式的优先级、应用隔离、路由进入及存储故障回归。 */
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDefaultLoginPasswordMode, getLoginPasswordModeKey, parseLoginPasswordMode, useLoginPasswordMode, usePasswordLoginModeStore } from './mode';

describe('密码登录模式', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
    vi.stubEnv('VITE_GLOB_APPNAME', 'iot');
    vi.stubEnv('VITE_GLOB_APPID', '300');
    vi.stubEnv('VITE_GLOB_LOGIN_PASSWORD_MODE', '');
    vi.stubEnv('PROD', false);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('默认 SHA256；env 默认值不写入用户记忆', () => {
    expect(usePasswordLoginModeStore().mode).toBe('sha256');
    vi.stubEnv('VITE_GLOB_LOGIN_PASSWORD_MODE', 'md5');
    usePasswordLoginModeStore().enterLogin(undefined);
    expect(usePasswordLoginModeStore().mode).toBe('md5');
    expect(window.localStorage.getItem(getLoginPasswordModeKey())).toBeNull();
  });

  it('有效 URL 高于应用记忆，应用记忆高于 env，手动选择立即覆盖当前 URL 模式', () => {
    vi.stubEnv('VITE_GLOB_LOGIN_PASSWORD_MODE', 'md5');
    window.localStorage.setItem(getLoginPasswordModeKey(), 'sha256');
    const store = usePasswordLoginModeStore();
    store.enterLogin(undefined);
    expect(store.mode).toBe('sha256');
    store.enterLogin('md5');
    expect(store.mode).toBe('md5');
    expect(window.localStorage.getItem(getLoginPasswordModeKey())).toBe('md5');
    store.selectMode('sha256');
    expect(store.mode).toBe('sha256');
    // 重新打开携带 MD5 的链接时仍由 URL 优先。
    store.enterLogin('md5');
    store.$reset();
    expect(store.mode).toBe('md5');
  });

  it.each([null, undefined, '', 'other', ['md5'], ['md5', 'sha256']])('忽略无效 URL：%j', (value) => {
    vi.stubEnv('VITE_GLOB_LOGIN_PASSWORD_MODE', 'md5');
    window.localStorage.setItem(getLoginPasswordModeKey(), 'corrupted');
    usePasswordLoginModeStore().enterLogin(value);
    expect(parseLoginPasswordMode(value)).toBeUndefined();
    expect(usePasswordLoginModeStore().mode).toBe('md5');
  });

  it('生产外置配置优先于构建 env，旧配置缺项和无效值均有默认值', () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_GLOB_LOGIN_PASSWORD_MODE', 'sha256');
    vi.stubGlobal('_VBEN_ADMIN_PRO_APP_CONF_', { VITE_GLOB_LOGIN_PASSWORD_MODE: 'md5' });
    expect(getDefaultLoginPasswordMode()).toBe('md5');
    vi.stubGlobal('_VBEN_ADMIN_PRO_APP_CONF_', { VITE_GLOB_LOGIN_PASSWORD_MODE: 'invalid' });
    expect(getDefaultLoginPasswordMode()).toBe('sha256');
    vi.stubGlobal('_VBEN_ADMIN_PRO_APP_CONF_', undefined);
    expect(getDefaultLoginPasswordMode()).toBe('sha256');
    vi.unstubAllGlobals();
  });

  it('同域不同应用隔离，新实例可恢复原应用记忆', () => {
    usePasswordLoginModeStore().selectMode('md5');
    vi.stubEnv('VITE_GLOB_APPNAME', 'console');
    setActivePinia(createPinia());
    expect(usePasswordLoginModeStore().mode).toBe('sha256');
    vi.stubEnv('VITE_GLOB_APPNAME', 'iot');
    setActivePinia(createPinia());
    expect(usePasswordLoginModeStore().mode).toBe('md5');
    vi.stubEnv('VITE_GLOB_APPID', '301');
    setActivePinia(createPinia());
    expect(usePasswordLoginModeStore().mode).toBe('sha256');
  });

  it('存储读写抛错仍可切换，并在当前应用会话中保留', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const store = usePasswordLoginModeStore();
    store.selectMode('md5');
    store.enterLogin(undefined);
    store.$reset();
    expect(store.mode).toBe('md5');
  });

  it('企业前缀 URL 生效，手动切换不导航，业务页过期弹窗不采纳业务 query', async () => {
    const pinia = createPinia();
    const Probe = defineComponent({
      setup() {
        const mode = useLoginPasswordMode();
        return () => h('span', mode.mode);
      },
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/:orgId/auth/login', name: 'Login', component: Probe },
        { path: '/dashboard', name: 'Dashboard', component: Probe },
      ],
    });
    await router.push('/demo/auth/login?passwordMode=md5&redirect=%2Fdashboard');
    const wrapper = mount(Probe, { global: { plugins: [pinia, router] } });
    const store = usePasswordLoginModeStore(pinia);
    expect(store.mode).toBe('md5');
    const originalPath = router.currentRoute.value.fullPath;
    store.selectMode('sha256');
    expect(router.currentRoute.value.fullPath).toBe(originalPath);
    await router.push('/dashboard?passwordMode=md5');
    expect(store.mode).toBe('sha256');
    await router.push(originalPath);
    expect(store.mode).toBe('md5');
    wrapper.unmount();
  });
});
