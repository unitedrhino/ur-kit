import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AiChatFloat from './AiChatFloat.vue';

const mocks = vi.hoisted(() => ({
  accessStore: {
    accessToken: '',
  },
  checkAiAvailable: vi.fn(),
  route: {
    path: '/auth/register',
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mocks.accessStore,
}));

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}));

vi.mock('@vben-core/shadcn-ui', () => ({
  VbenIcon: {
    name: 'VbenIcon',
    template: '<span data-test="icon" />',
  },
}));

vi.mock('./api', () => ({
  checkAiAvailable: mocks.checkAiAvailable,
}));

vi.mock('./AiChatPanel.vue', () => ({
  __esModule: true,
  default: {
    name: 'AiChatPanel',
    template: '<div data-test="ai-chat-panel"><input aria-label="测试草稿" /></div>',
  },
}));

describe('aiChatFloat availability check timing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.accessStore.accessToken = '';
    mocks.route.path = '/auth/register';
    mocks.checkAiAvailable.mockResolvedValue({ available: true });
    window.matchMedia = vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    }));
  });

  it('does not check AI availability on auth pages', async () => {
    mocks.accessStore.accessToken = 'token';
    mocks.route.path = '/auth/register';

    mount(AiChatFloat);
    await flushPromises();

    expect(mocks.checkAiAvailable).not.toHaveBeenCalled();
  });

  it('does not check AI availability before login', async () => {
    mocks.accessStore.accessToken = '';
    mocks.route.path = '/dashboard';

    mount(AiChatFloat);
    await flushPromises();

    expect(mocks.checkAiAvailable).not.toHaveBeenCalled();
  });

  it('checks AI availability after login on a business page', async () => {
    mocks.accessStore.accessToken = 'token';
    mocks.route.path = '/dashboard';

    mount(AiChatFloat);
    await flushPromises();

    expect(mocks.checkAiAvailable).toHaveBeenCalledTimes(1);
  });

  it('allows dragging the floating button without opening the panel', async () => {
    mocks.accessStore.accessToken = 'token';
    mocks.route.path = '/dashboard';

    const wrapper = mount(AiChatFloat);
    await flushPromises();

    const button = wrapper.get('button[aria-label="打开 AI 助手"]');
    vi.spyOn(button.element, 'getBoundingClientRect').mockReturnValue({
      bottom: 744,
      height: 56,
      left: 944,
      right: 1000,
      top: 688,
      width: 56,
      x: 944,
      y: 688,
      toJSON: () => ({}),
    });
    await button.trigger('pointerdown', { button: 0, clientX: 972, clientY: 716, pointerId: 1 });
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 912, clientY: 686, pointerId: 1 }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 912, clientY: 686, pointerId: 1 }));
    await button.trigger('click');

    expect(button.attributes('style')).toContain('left: 884px');
    expect(button.attributes('style')).toContain('top: 658px');
    expect(wrapper.find('[data-test="ai-chat-panel"]').exists()).toBe(false);
  });

  it('keeps saved positions inside the bottom-right drag area', async () => {
    mocks.accessStore.accessToken = 'token';
    mocks.route.path = '/dashboard';
    window.localStorage.setItem('ai_chat_float_position', JSON.stringify({ left: 100, top: 100 }));

    const wrapper = mount(AiChatFloat);
    await flushPromises();

    const button = wrapper.get('button[aria-label="打开 AI 助手"]');

    expect(button.attributes('style')).toContain('left: 664px');
    expect(button.attributes('style')).toContain('top: 508px');
  });
});


it('居中弹窗关闭后保留同一个工作台实例和草稿，不挤压业务页面', async () => {
  mocks.accessStore.accessToken = 'token'; mocks.route.path = '/dashboard';
  mocks.checkAiAvailable.mockResolvedValue({ available: true });
  const wrapper = mount(AiChatFloat, { attachTo: document.body });
  await flushPromises();
  await wrapper.get('button[aria-label="打开 AI 助手"]').trigger('click');
  await flushPromises();
  const input = document.querySelector('input[aria-label="测试草稿"]') as HTMLInputElement;
  expect(input).not.toBeNull(); input.value = '保留草稿';
  expect(document.documentElement.style.paddingRight).toBe('');
  const close = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('关闭 AI 工作台'))!;
  close.click(); await flushPromises();
  await wrapper.get('button[aria-label="打开 AI 助手"]').trigger('click'); await flushPromises();
  expect(document.querySelector('input[aria-label="测试草稿"]')).toBe(input);
  expect(input.value).toBe('保留草稿');
  wrapper.unmount();
});
