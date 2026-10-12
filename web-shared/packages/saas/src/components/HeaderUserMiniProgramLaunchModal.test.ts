// @vitest-environment happy-dom
/**
 * HeaderUserMiniProgramLaunchModal 单测，覆盖打开时动态获取 URL Link、缺少企业号校验与错误态。
 */
import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const modalState = vi.hoisted(() => ({
  isOpen: false,
  onOpenChange: undefined as undefined | ((isOpen: boolean) => void),
  qrInput: undefined as unknown,
}));

const getUrlLinkMock = vi.hoisted(() => vi.fn());
const getAppOpenUrlMock = vi.hoisted(() => vi.fn(() => 'https://saas.unitedrhino.com/app/console/'));

vi.mock('@vben/api', () => ({
  CoreApi: {
    postApiV1SystemAppInfoWxMiniGetUrlLink: getUrlLinkMock,
  },
}));

vi.mock('../utils', () => ({
  getAppOpenUrl: getAppOpenUrlMock,
}));

vi.mock('@vben/common-ui', async () => {
  const { defineComponent } = await vi.importActual<typeof import('vue')>('vue');
  return {
    useVbenModal: (options?: { onOpenChange?: (isOpen: boolean) => void }) => {
      modalState.onOpenChange = options?.onOpenChange;
      return [
        defineComponent({
          name: 'MockModal',
          template: '<section><slot /></section>',
          props: {
            title: String,
          },
        }),
        {
          open: () => {
            modalState.isOpen = true;
            modalState.onOpenChange?.(true);
          },
          close: () => {
            modalState.isOpen = false;
            modalState.onOpenChange?.(false);
          },
        },
      ];
    },
  };
});

vi.mock('@vueuse/integrations/useQRCode', () => ({
  useQRCode: (input: unknown) => {
    modalState.qrInput = input;
    return 'data:image/png;base64,test-qrcode';
  },
}));

vi.mock('@vben-core/shadcn-ui', async () => {
  const { defineComponent } = await vi.importActual<typeof import('vue')>('vue');
  return {
    Button: defineComponent({
      name: 'Button',
      template: '<button type="button"><slot /></button>',
    }),
  };
});

vi.mock('@vben/icons', async () => {
  const { defineComponent } = await vi.importActual<typeof import('vue')>('vue');
  return {
    IconifyIcon: defineComponent({
      name: 'IconifyIcon',
      template: '<i />',
      props: {
        icon: String,
      },
    }),
  };
});

import HeaderUserMiniProgramLaunchModal from './HeaderUserMiniProgramLaunchModal.vue';

describe('HeaderUserMiniProgramLaunchModal', () => {
  beforeEach(() => {
    modalState.isOpen = false;
    modalState.onOpenChange = undefined;
    modalState.qrInput = undefined;
    getUrlLinkMock.mockReset();
    getAppOpenUrlMock.mockReturnValue('https://saas.unitedrhino.com/app/console/');
  });

  it('renders a QR code when the URL Link is fetched successfully', async () => {
    getUrlLinkMock.mockResolvedValue({ urlLink: 'https://wxaurl.cn/test-link' });

    const wrapper = mount(HeaderUserMiniProgramLaunchModal, {
      props: {
        modelValue: true,
        payload: { appID: '700', appName: '物联网客户端', orgId: 'org-001' },
      },
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain('未获取到当前企业号');
    expect(wrapper.find('img[alt="微信小程序二维码"]').exists()).toBe(true);

    const launchUrl = String((modalState.qrInput as { value?: string })?.value || '');
    expect(launchUrl).toContain('/app/console/mini-launch.html');
  });

  it('passes org id and app id in the URL Link query', async () => {
    getUrlLinkMock.mockResolvedValue({ urlLink: 'https://wxaurl.cn/test-link' });

    mount(HeaderUserMiniProgramLaunchModal, {
      props: {
        modelValue: true,
        payload: { appID: '700', appName: '物联网客户端', orgId: 'org-002' },
      },
    });
    await flushPromises();

    expect(getUrlLinkMock).toHaveBeenCalledWith({
      appID: '700',
      query: 'org-id=org-002&from=console&appID=700',
    });
  });

  it('shows an error and does not request URL Link when org id is missing', async () => {
    const wrapper = mount(HeaderUserMiniProgramLaunchModal, {
      props: {
        modelValue: true,
        payload: { appID: '700', appName: '物联网客户端' },
      },
    });
    await flushPromises();

    expect(getUrlLinkMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('未获取到当前企业号');
    expect(wrapper.find('img[alt="微信小程序二维码"]').exists()).toBe(false);
  });

  it('shows an error when the URL Link request fails', async () => {
    getUrlLinkMock.mockRejectedValue(new Error('生成链接失败'));

    const wrapper = mount(HeaderUserMiniProgramLaunchModal, {
      props: {
        modelValue: true,
        payload: { appID: '700', appName: '物联网客户端', orgId: 'org-001' },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('生成链接失败');
  });
});
