import type { KnowledgeTreeNode } from '../data';

import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import CompileProgressBar from '../components/compile-progress-bar.vue';

// ui 基础件用轻桩替身，保留 disabled/checked 挂点以驱动批量交互
vi.mock('@unitedrhino/saas-ui/ui/badge', () => ({ Badge: { template: '<span><slot /></span>', props: ['variant'] } }));
vi.mock('@unitedrhino/saas-ui/ui/button', () => ({
  Button: { props: ['disabled'], template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/checkbox', () => ({
  Checkbox: {
    props: ['checked'],
    emits: ['update:checked'],
    template: `<input type="checkbox" data-test="stub-checkbox" :checked="checked" @change="$emit('update:checked', $event.target.checked)" />`,
  },
}));
vi.mock('@unitedrhino/saas-ui/ui/dialog', () => ({
  Dialog: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}));
vi.mock('lucide-vue-next', () => ({ LoaderCircle: { template: '<i />' } }));

const apiMocks = vi.hoisted(() => ({ getFailedDocuments: vi.fn(), retryCompile: vi.fn(), deleteNode: vi.fn() }));

vi.mock('../index.api', () => ({
  Api: {
    getFailedDocuments: apiMocks.getFailedDocuments,
    retryCompile: apiMocks.retryCompile,
    deleteNode: apiMocks.deleteNode,
  },
}));

function failedNode(id: number, name: string): KnowledgeTreeNode {
  return { id, lastError: '解析超时', name, nodeType: 'file', parentID: 0, path: name } as KnowledgeTreeNode;
}

function mountBar() {
  return mount(CompileProgressBar, {
    props: {
      canWrite: true,
      knowledge: {
        compiledDocumentCount: 0,
        desc: '',
        documentCount: 2,
        failedDocumentCount: 2,
        id: 7,
        name: '手册库',
        scope: 'tenant',
        status: 'failed',
      },
    },
  });
}

beforeEach(() => {
  apiMocks.getFailedDocuments.mockReset();
  apiMocks.retryCompile.mockReset();
  apiMocks.deleteNode.mockReset();
});

describe('compileProgressBar 失败文档批量条', () => {
  it('打开失败列表后勾选出现批量条，全选后显示已选数量', async () => {
    apiMocks.getFailedDocuments.mockResolvedValue({ list: [failedNode(1, 'a.pdf'), failedNode(2, 'b.pdf')] });
    const wrapper = mountBar();
    await (wrapper.vm as any).openFailedDocuments();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('已选');
    const checkboxes = wrapper.findAll('[data-test="stub-checkbox"]');
    expect(checkboxes).toHaveLength(3); // 全选 + 两条文档
    await checkboxes[0]?.setValue(true);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('已选 2 项');
  });

  it('批量重试逐个提交并通知壳层刷新', async () => {
    apiMocks.getFailedDocuments.mockResolvedValue({ list: [failedNode(1, 'a.pdf'), failedNode(2, 'b.pdf')] });
    apiMocks.retryCompile.mockResolvedValue({});
    const wrapper = mountBar();
    await (wrapper.vm as any).openFailedDocuments();
    await wrapper.vm.$nextTick();
    await wrapper.findAll('[data-test="stub-checkbox"]')[1]?.setValue(true);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '批量重试')
      ?.trigger('click');
    await vi.waitFor(() => expect(apiMocks.retryCompile).toHaveBeenCalledTimes(1));
    expect(apiMocks.retryCompile).toHaveBeenCalledWith(7, 'all', { documentID: 1 });
    expect(wrapper.emitted('changed')).toHaveLength(1);
  });

  it('批量删除确认后逐个删除并刷新失败列表', async () => {
    apiMocks.getFailedDocuments.mockResolvedValue({ list: [failedNode(1, 'a.pdf'), failedNode(2, 'b.pdf')] });
    apiMocks.deleteNode.mockResolvedValue({ deletedCount: 1 });
    const wrapper = mountBar();
    await (wrapper.vm as any).openFailedDocuments();
    await wrapper.vm.$nextTick();
    await wrapper.findAll('[data-test="stub-checkbox"]')[2]?.setValue(true);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '批量删除')
      ?.trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '确认删除')
      ?.trigger('click');
    await vi.waitFor(() => expect(apiMocks.deleteNode).toHaveBeenCalledWith(2));
    expect(wrapper.emitted('changed')).toHaveLength(1);
    // 删除后重新拉取失败列表
    expect(apiMocks.getFailedDocuments).toHaveBeenCalledTimes(2);
  });
});
