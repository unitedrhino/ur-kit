import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  authLoginMock: vi.fn(),
  readMock: vi.fn(),
  updateSingleAppInfoMock: vi.fn(),
  messageErrorMock: vi.fn(),
}));

vi.hoisted(() => {
  vi.stubEnv('VITE_APP_NAMESPACE', 'saas-test');
  vi.stubEnv('VITE_APP_STORE_SECURE_KEY', 'saas-test-key');
  vi.stubEnv('VITE_APP_VERSION', 'test');
  vi.stubEnv('VITE_GLOB_APPID', '77');
  vi.stubEnv('VITE_GLOB_APPNAME', 'saas-test');
});

import Login from './login.vue';

vi.mock('./index.api', () => ({
  Api: {
    getImageCaptcha: vi.fn().mockResolvedValue({ codeID: 'captcha-1', url: 'https://example.com/captcha.png' }),
    read: mocks.readMock,
    thirdAuthStart: vi.fn(),
  },
}));

vi.mock('../../../store', () => ({
  useAuthStore: () => ({
    authLogin: mocks.authLoginMock,
    loginLoading: false,
  }),
  useAppInfoStore: () => ({
    updateSingleAppInfo: mocks.updateSingleAppInfoMock,
  }),
}));

vi.mock('@vben/stores', () => ({
  useSystemConfigStore: () => ({
    systemConfig: {
      oem: {},
    },
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual<typeof import('naive-ui')>('naive-ui');
  return {
    ...actual,
    useMessage: () => ({
      error: mocks.messageErrorMock,
    }),
  };
});

describe('third login entry visibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.stubEnv('VITE_GLOB_APPID', '77');
  });

  it('shows google github apple entries when app loginTypes enable them', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['pwd', 'google', 'github', 'apple'],
      useBy: 'client',
      // 实现要求：除 loginTypes 外还必须配置了对应第三方接入配置（非空对象）才显示入口
      googleConfig: { appID: 'g-1' },
      githubConfig: { appID: 'gh-1' },
      appleConfig: { appID: 'a-1' },
    });

    const wrapper = mount(Login, {
      global: {
        stubs: {
          AuthenticationLogin: {
            name: 'AuthenticationLogin',
            template: '<div><slot name="third-party-login" /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Google 登录');
    expect(wrapper.text()).toContain('GitHub 登录');
    expect(wrapper.text()).toContain('Apple 登录');
  });

  it('hides third-party entries when login type is enabled without provider config', async () => {
    // 门控负例：loginTypes 声明了 google 但未配置 googleConfig 接入 → 不显示入口
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['pwd', 'google'],
      useBy: 'client',
    });

    const wrapper = mount(Login, {
      global: {
        stubs: {
          AuthenticationLogin: {
            name: 'AuthenticationLogin',
            template: '<div><slot name="third-party-login" /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).not.toContain('Google 登录');
  });
});
