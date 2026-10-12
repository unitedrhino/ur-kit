/**
 * 文件说明：AI 工具详情首屏按需加载测试。
 * 覆盖弹窗初次只取 skill.md，以及打开源码时再读取 executor.js。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AiToolDetail from './AiToolDetail.vue';

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock('naive-ui', () => ({
  NButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  NInput: { template: '<input />' },
  NSpace: { template: '<div><slot /></div>' },
  NTag: { template: '<span><slot /></span>' },
  useDialog: () => ({ warning: vi.fn() }),
  useMessage: () => ({ error: vi.fn(), info: vi.fn(), success: vi.fn() }),
}));

vi.mock('../ai-elements/code-block', () => ({
  CodeBlock: { props: ['code'], template: '<pre>{{ code }}</pre>' },
}));
vi.mock('../ai-tool-dev', () => ({
  AiToolDevPanel: {
    props: ['cloneId'],
    template: '<div data-test="tool-dev-clone">{{ cloneId }}</div>',
  },
}));
vi.mock('../ai-tool', () => ({
  DocumentRenderer: { props: ['documentMd'], template: '<article>{{ documentMd }}</article>' },
}));
vi.mock('./api', () => ({
  aiToolApi: {
    getOne: mocks.getOne,
    remove: vi.fn(),
  },
}));

describe('AiToolDetail 按需加载', () => {
  beforeEach(() => {
    mocks.getOne.mockReset();
    mocks.getOne.mockResolvedValue({
      info: { id: 12, name: '电压越限判断', status: 1 },
      artifact: {
        documentMd: '# 工具文档',
        executorJs: 'console.log(1)',
        manifestJson: '{"name":"x"}',
      },
    });
  });

  it('首屏只读取文档，源码在点击后加载', async () => {
    const wrapper = mount(AiToolDetail, { props: { toolId: 12 } });
    await flushPromises();

    expect(mocks.getOne).toHaveBeenNthCalledWith(1, 12, ['skill.md']);

    const sourceButton = wrapper.findAll('button').find((button) => button.text() === '源码');
    expect(sourceButton).toBeTruthy();
    await sourceButton!.trigger('click');
    await flushPromises();

    expect(mocks.getOne).toHaveBeenNthCalledWith(2, 12, ['executor.js']);
  });

  it('将项目级分身 ID 按 Vue 属性规则透传给开发面板', async () => {
    const wrapper = mount(AiToolDetail, { props: { toolId: 12, cloneId: '9007199254740997' } });
    await flushPromises();

    expect(wrapper.get('[data-test="tool-dev-clone"]').text()).toBe('9007199254740997');
  });

  it('紧凑嵌入模式压缩外边距并隐藏重复返回入口', async () => {
    const wrapper = mount(AiToolDetail, { props: { toolId: 12, compact: true } });
    await flushPromises();

    expect(wrapper.get('[data-testid="ai-tool-detail"]').classes()).toContain('p-0');
    expect(wrapper.get('h1').classes()).toContain('text-base');
    expect(wrapper.find('.i-lucide\\:arrow-left').exists()).toBe(false);
  });
});
