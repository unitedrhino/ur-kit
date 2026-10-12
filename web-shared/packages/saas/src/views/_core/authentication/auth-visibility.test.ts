import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Login from './login.vue';
import Register from './register.vue';

const mocks = vi.hoisted(() => {
  vi.stubEnv('VITE_APP_NAMESPACE', 'saas-test');
  vi.stubEnv('VITE_APP_STORE_SECURE_KEY', 'saas-test-key');
  vi.stubEnv('VITE_APP_VERSION', 'test');
  vi.stubEnv('VITE_GLOB_APPID', '77');
  vi.stubEnv('VITE_GLOB_APPNAME', 'saas-test');

  return {
    authLoginMock: vi.fn(),
    authLoginWithResultMock: vi.fn(),
    destroyAllMock: vi.fn(),
    getImageCaptchaMock: vi.fn(),
    messageErrorMock: vi.fn(),
    messageSuccessMock: vi.fn(),
    messageWarningMock: vi.fn(),
    readMock: vi.fn(),
    routeMock: {
      query: {} as Record<string, string>,
    },
    routerPushMock: vi.fn(),
    routerReplaceMock: vi.fn(),
    updateSingleAppInfoMock: vi.fn(),
  };
});

vi.mock('./index.api', () => ({
  Api: {
    getImageCaptcha: mocks.getImageCaptchaMock,
    read: mocks.readMock,
    sendEmailCode: vi.fn(),
    sendPhoneCode: vi.fn(),
  },
}));

vi.mock('../../../store', () => ({
  useAppInfoStore: () => ({
    updateSingleAppInfo: mocks.updateSingleAppInfoMock,
  }),
  useAuthStore: () => ({
    authLogin: mocks.authLoginMock,
    authLoginWithResult: mocks.authLoginWithResultMock,
    loginLoading: false,
  }),
}));

vi.mock('@vben/stores', () => ({
  useSystemConfigStore: () => ({
    systemConfig: {
      oem: {},
    },
  }),
}));

vi.mock('../../../adapter/naive', () => ({
  message: {
    destroyAll: mocks.destroyAllMock,
    error: mocks.messageErrorMock,
    success: mocks.messageSuccessMock,
    warning: mocks.messageWarningMock,
  },
}));

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual<typeof import('naive-ui')>('naive-ui');

  return {
    ...actual,
    NStep: {
      name: 'NStep',
      template: '<div data-test="step" />',
    },
    NSteps: {
      name: 'NSteps',
      template: '<div data-test="steps"><slot /></div>',
    },
    useMessage: () => ({
      error: mocks.messageErrorMock,
    }),
  };
});

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');

  return {
    ...actual,
    useRoute: () => mocks.routeMock,
    useRouter: () => ({
      push: mocks.routerPushMock,
      replace: mocks.routerReplaceMock,
    }),
  };
});

describe('authentication app visibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.stubEnv('VITE_GLOB_APPID', '77');
    mocks.routeMock.query = {};
    mocks.getImageCaptchaMock.mockResolvedValue({
      codeID: 'captcha-1',
      url: 'https://example.com/captcha.png',
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllEnvs();
  });

  it('preserves invite code from redirect before an unregistered user signs up', async () => {
    mocks.routeMock.query = {
      redirect: encodeURIComponent('/auth/invite?code=tenant-a-c1234567890'),
    };
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: [],
      useBy: 'client',
    });

    mount(Register);

    await flushPromises();

    expect(window.sessionStorage.getItem('saas:pending-invite-code')).toBe('tenant-a-c1234567890');
  });

  it('shows the register form when app loginTypes is an empty array', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: [],
      useBy: 'client',
    });

    const wrapper = mount(Register);

    await flushPromises();

    expect(wrapper.find('button[aria-label="register"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('应用未开启注册，请联系管理配置');
  });

  it('hides the register entry when app does not support email or phone self-registration', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['wxOpen'],
      useBy: 'client',
    });

    const wrapper = mount(Login, {
      global: {
        stubs: {
          AuthenticationLogin: {
            name: 'AuthenticationLogin',
            props: ['showRegister'],
            template: `
              <div data-test="auth-login">
                <span v-if="showRegister" data-test="register-entry">register</span>
              </div>
            `,
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-test="register-entry"]').exists()).toBe(false);
  });

  it('redirects directly to QR code login when wxOpen is the only login type', async () => {
    mocks.routeMock.query = { redirect: '/survey' };
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['wxOpen'],
      useBy: 'client',
    });

    mount(Login);

    await flushPromises();

    expect(mocks.routerReplaceMock).toHaveBeenCalledWith({
      path: '/auth/qrcode-login',
      query: { redirect: '/survey' },
    });
    expect(mocks.getImageCaptchaMock).not.toHaveBeenCalled();
  });

  it('shows email code login when app loginTypes enables email without phone', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['pwd', 'email'],
      useBy: 'client',
    });

    const wrapper = mount(Login, {
      global: {
        stubs: {
          AuthenticationLogin: {
            name: 'AuthenticationLogin',
            props: ['showCodeLogin', 'showEmailCodeLogin'],
            template: `
              <div data-test="auth-login">
                <span v-if="showCodeLogin" data-test="phone-code-login">phone</span>
                <span v-if="showEmailCodeLogin" data-test="email-code-login">email</span>
              </div>
            `,
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-test="phone-code-login"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="email-code-login"]').exists()).toBe(true);
  });

  it('shows phone and email login entries when app loginTypes is an empty array', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: [],
      useBy: 'client',
    });

    const wrapper = mount(Login, {
      global: {
        stubs: {
          AuthenticationLogin: {
            name: 'AuthenticationLogin',
            props: ['showCodeLogin', 'showEmailCodeLogin'],
            template: `
              <div data-test="auth-login">
                <span v-if="showCodeLogin" data-test="phone-code-login">phone</span>
                <span v-if="showEmailCodeLogin" data-test="email-code-login">email</span>
              </div>
            `,
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-test="phone-code-login"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="email-code-login"]').exists()).toBe(true);
  });

  it('hides phone and email login entries when app loginTypes only enables pwd', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['pwd'],
      useBy: 'client',
    });

    const wrapper = mount(Login, {
      global: {
        stubs: {
          AuthenticationLogin: {
            name: 'AuthenticationLogin',
            props: ['showCodeLogin', 'showEmailCodeLogin'],
            template: `
              <div data-test="auth-login">
                <span v-if="showCodeLogin" data-test="phone-code-login">phone</span>
                <span v-if="showEmailCodeLogin" data-test="email-code-login">email</span>
              </div>
            `,
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-test="phone-code-login"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="email-code-login"]').exists()).toBe(false);
  });

  // 第三方登录入口（钉钉/华为/Google/GitHub/Apple）与扫码登录除 loginTypes 包含该类型外，
  // 还要求应用对应接入配置非空（dingConfig/huaweiConfig/.../wxOpenConfig），未配置一律不显示。
  const thirdVisibilityStubs = {
    AuthenticationLogin: {
      name: 'AuthenticationLogin',
      props: ['showQrcodeLogin'],
      template: `
        <div data-test="auth-login">
          <span v-if="showQrcodeLogin" data-test="qrcode-login">qr</span>
          <slot name="third-party-login" />
        </div>
      `,
    },
    ThirdLoginEntry: {
      name: 'ThirdLoginEntry',
      props: ['providers'],
      template: `<div v-if="providers && providers.length" data-test="third-providers">{{ providers.join(',') }}</div>`,
    },
  };

  it('hides all third-party and QR login entries when configs are empty even if loginTypes is an empty array', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: [],
      useBy: 'client',
      dingConfig: {},
      huaweiConfig: {},
      googleConfig: {},
      githubConfig: {},
      appleConfig: {},
      wxOpenConfig: {},
    });

    const wrapper = mount(Login, { global: { stubs: thirdVisibilityStubs } });

    await flushPromises();

    expect(wrapper.find('[data-test="third-providers"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="qrcode-login"]').exists()).toBe(false);
  });

  it('hides ding login when loginTypes enables ding but dingConfig is empty', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['pwd', 'ding'],
      useBy: 'client',
      dingConfig: {},
    });

    const wrapper = mount(Login, { global: { stubs: thirdVisibilityStubs } });

    await flushPromises();

    expect(wrapper.find('[data-test="third-providers"]').exists()).toBe(false);
  });

  it('shows ding login when loginTypes enables ding and dingConfig is configured', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['pwd', 'ding'],
      useBy: 'client',
      dingConfig: { appKey: 'ding-app-key' },
    });

    const wrapper = mount(Login, { global: { stubs: thirdVisibilityStubs } });

    await flushPromises();

    expect(wrapper.find('[data-test="third-providers"]').text()).toContain('ding');
  });

  it('hides QR login when loginTypes enables wxOpen but wxOpenConfig is empty', async () => {
    mocks.readMock.mockResolvedValue({
      id: '77',
      loginTypes: ['pwd', 'phone', 'wxOpen'],
      useBy: 'client',
      wxOpenConfig: {},
    });

    const wrapper = mount(Login, { global: { stubs: thirdVisibilityStubs } });

    await flushPromises();

    expect(wrapper.find('[data-test="qrcode-login"]').exists()).toBe(false);
  });
});
