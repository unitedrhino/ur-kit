import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAppInfoMock: vi.fn(),
}));

vi.hoisted(() => {
  vi.stubEnv('VITE_GLOB_APPID', '77');
  vi.stubEnv('VITE_APP_TITLE', '控制台');
  vi.stubEnv('VITE_GLOB_APPNAME', 'console');
});

vi.mock('../../../store', () => ({
  useAppInfoStore: () => ({
    getAppInfo: mocks.getAppInfoMock,
  }),
}));

import CurrentAppBadge from './current-app-badge.vue';

describe('CurrentAppBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_GLOB_APPID', '77');
    vi.stubEnv('VITE_APP_TITLE', '控制台');
    vi.stubEnv('VITE_GLOB_APPNAME', 'console');
  });

  it('renders backend app name when public app info loads', async () => {
    mocks.getAppInfoMock.mockResolvedValue({ id: '77', name: 'SaaS 控制台' });

    const wrapper = mount(CurrentAppBadge);
    await flushPromises();

    expect(mocks.getAppInfoMock).toHaveBeenCalledWith('77');
    expect(wrapper.text()).toContain('｜ SaaS 控制台');
    expect(wrapper.classes()).toEqual(['whitespace-nowrap']);
    expect(wrapper.html()).not.toContain('border');
    expect(wrapper.html()).not.toContain('bg-muted');
  });

  it('renders env fallback when public app info fails', async () => {
    mocks.getAppInfoMock.mockRejectedValue(new Error('network failed'));

    const wrapper = mount(CurrentAppBadge);
    await flushPromises();

    expect(wrapper.text()).toContain('｜ 控制台');
  });
});
