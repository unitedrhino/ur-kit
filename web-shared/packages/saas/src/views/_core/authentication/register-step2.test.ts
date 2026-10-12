import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterStep2 from './register-step2.vue';

const mocks = vi.hoisted(() => ({
  createTenantMock: vi.fn(),
  fetchUserInfoMock: vi.fn(),
  formGetValuesMock: vi.fn(),
  formValidateMock: vi.fn(),
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  routerPushMock: vi.fn(),
  routerReplaceMock: vi.fn(),
  setTenantMock: vi.fn(),
  setValuesMock: vi.fn(),
  userStore: {
    userInfo: null as null | Record<string, unknown>,
  },
}));

vi.mock('@vben/api', () => ({
  CoreApi: {
    postApiV1SystemTenantInfoCreate: mocks.createTenantMock,
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => mocks.userStore,
}));

vi.mock('../../../store/auth', () => ({
  useAuthStore: () => ({
    fetchUserInfo: mocks.fetchUserInfoMock,
  }),
}));

vi.mock('../../../store/session', () => ({
  useSessionStore: () => ({
    setTenant: mocks.setTenantMock,
  }),
}));

vi.mock('@vben/saas', () => ({
  ORG_ID_KEY: 'org-id',
  useVbenForm: () => [
    {
      name: 'MockForm',
      template: '<div data-test="form" />',
    },
    {
      getValues: mocks.formGetValuesMock,
      setValues: mocks.setValuesMock,
      validate: mocks.formValidateMock,
    },
  ],
}));

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual<typeof import('naive-ui')>('naive-ui');

  return {
    ...actual,
    NButton: {
      name: 'NButton',
      emits: ['click'],
      inheritAttrs: false,
      props: ['loading'],
      template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
    },
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
      success: mocks.messageSuccessMock,
    }),
  };
});

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');

  return {
    ...actual,
    useRouter: () => ({
      push: mocks.routerPushMock,
      replace: mocks.routerReplaceMock,
    }),
  };
});

describe('register step2 tenant creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.userStore.userInfo = null;
    mocks.formValidateMock.mockResolvedValue({ valid: true });
    mocks.formGetValuesMock.mockResolvedValue({
      industry: 'internet',
      name: '新企业',
      requirement: 'use',
    });
    mocks.createTenantMock.mockResolvedValue({ code: 'tenant-new' });
  });

  it('refreshes current tenant context after creating an enterprise', async () => {
    const wrapper = mount(RegisterStep2);

    await flushPromises();
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(mocks.createTenantMock).toHaveBeenCalledWith({
      desc: undefined,
      name: '新企业',
    });
    expect(mocks.setTenantMock).toHaveBeenCalledWith('tenant-new');
    expect(mocks.fetchUserInfoMock).toHaveBeenCalledOnce();
    expect(mocks.routerPushMock).toHaveBeenCalledWith('/auth/register/step3');
  });
});
