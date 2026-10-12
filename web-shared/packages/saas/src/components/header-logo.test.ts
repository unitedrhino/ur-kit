import { h, nextTick } from 'vue';

import { mount } from '@vue/test-utils';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import HeaderLogo from './header-logo.vue';

vi.mock('../adapter/naive', () => ({
  message: {
    error: vi.fn(),
  },
}));

vi.mock('../utils', () => ({
  getBackToConsoleUrl: vi.fn(() => '/console'),
}));

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}

    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(240);
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function createGlobalStubs() {
  return {
    Popover: {
      props: ['open'],
      template: '<div data-test="popover-root" :data-open="String(open)"><slot></slot></div>',
    },
    PopoverTrigger: {
      template: '<div data-test="popover-trigger"><slot></slot></div>',
    },
    PopoverContent: {
      template: '<div data-test="popover-content"><slot></slot></div>',
    },
    VbenAvatar: {
      template: '<div class="avatar-stub"></div>',
    },
    VbenIcon: {
      template: '<div class="icon-stub"></div>',
    },
    VbenTooltip: {
      template: '<div><slot name="trigger"></slot><slot></slot></div>',
    },
  } as any;
}

describe('HeaderLogo', () => {
  it('supports hiding the back entry and app menu independently', () => {
    const wrapper = mount(HeaderLogo, {
      props: {
        appName: '运营中心',
        showAppMenu: false,
        showBack: false,
      },
      slots: {
        'app-menu': () => h('div', { 'data-test': 'app-menu-panel' }, '平台管理'),
      },
      global: {
        stubs: createGlobalStubs(),
      },
    });

    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.find('[data-test="header-app-menu-trigger"]').exists()).toBe(false);
    expect(wrapper.find('.header-logo-container').classes()).toContain('pl-3');
    expect(wrapper.text()).toContain('运营中心');

    wrapper.unmount();
  });

  it('renders the app menu through popover trigger and content primitives', () => {
    const wrapper = mount(HeaderLogo, {
      props: {
        appName: '物联网网',
      },
      slots: {
        'app-menu': () => h('div', { 'data-test': 'app-menu-panel' }, '平台管理'),
      },
      global: {
        stubs: createGlobalStubs(),
      },
    });

    const trigger = wrapper.find('[data-test="header-app-menu-trigger"]');
    const content = wrapper.find('[data-test="popover-content"]');
    const panel = content.find('[data-test="app-menu-panel"]');

    expect(trigger.exists()).toBe(true);
    expect(content.exists()).toBe(true);
    expect(panel.exists()).toBe(true);

    wrapper.unmount();
  });

  it('delays opening the app menu on hover but opens immediately on click', async () => {
    vi.useFakeTimers();

    const wrapper = mount(HeaderLogo, {
      props: {
        appName: '物联网应用',
      },
      slots: {
        'app-menu': () => h('div', { 'data-test': 'app-menu-panel' }, '平台管理'),
      },
      global: {
        stubs: createGlobalStubs(),
      },
    });

    const trigger = wrapper.find('[data-test="header-app-menu-trigger"]');
    const popover = wrapper.find('[data-test="popover-root"]');

    expect(popover.attributes('data-open')).toBe('false');

    await trigger.trigger('mouseenter');
    await nextTick();

    expect(popover.attributes('data-open')).toBe('false');

    vi.advanceTimersByTime(400);
    await nextTick();

    expect(popover.attributes('data-open')).toBe('true');

    await trigger.trigger('mouseleave');
    vi.advanceTimersByTime(120);
    await nextTick();

    expect(popover.attributes('data-open')).toBe('false');

    await trigger.trigger('click');
    await nextTick();

    expect(popover.attributes('data-open')).toBe('true');

    wrapper.unmount();
  });
});
