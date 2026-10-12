import type { KnowledgeTreeNode } from '../data';

import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import DocumentTree from '../components/document-tree.vue';

// Naive Tree 的勾选交互以事件方式模拟，桩内保留勾选键与节点渲染即可覆盖批量条逻辑
vi.mock('naive-ui', () => ({
  NTree: {
    props: ['checkedKeys', 'checkable', 'data', 'selectedKeys'],
    emits: ['update:checkedKeys'],
    template: `<div data-test="stub-tree">
      <button
        v-for="option in data"
        :key="option.key"
        :data-test="'stub-node-' + option.key"
        @click="$emit('update:checkedKeys', [...(checkedKeys || []), option.key])"
      >{{ option.label }}</button>
    </div>`,
  },
  NDropdown: { template: '<div />' },
  NSpin: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/tree', () => ({}));

const apiMocks = vi.hoisted(() => ({
  retryCompile: vi.fn(),
  deleteNode: vi.fn(),
}));

vi.mock('../index.api', () => ({
  Api: {
    retryCompile: apiMocks.retryCompile,
    deleteNode: apiMocks.deleteNode,
    createFolder: vi.fn(),
    moveNode: vi.fn(),
    getTree: vi.fn(),
  },
}));

vi.mock('@unitedrhino/saas-ui/ui/badge', () => ({ Badge: { template: '<span><slot /></span>' } }));
vi.mock('@unitedrhino/saas-ui/ui/button', () => ({
  Button: { template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>', props: ['disabled'] },
}));
vi.mock('@unitedrhino/saas-ui/ui/dialog', () => ({
  Dialog: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/empty', () => ({
  Empty: { template: '<div><slot /></div>' },
  EmptyDescription: { template: '<div><slot /></div>' },
  EmptyHeader: { template: '<div><slot /></div>' },
  EmptyTitle: { template: '<div><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/input', () => ({ Input: { props: ['modelValue'], template: '<input />' } }));
vi.mock('@unitedrhino/saas-ui/ui/tooltip', () => ({
  Tooltip: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  TooltipProvider: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' },
}));
vi.mock('lucide-vue-next', () => ({
  File: { template: '<i />' },
  Folder: { template: '<i />' },
  FolderPlus: { template: '<i />' },
  LoaderCircle: { template: '<i />' },
  Search: { template: '<i />' },
  Upload: { template: '<i />' },
}));

function fileNode(id: number, name: string): KnowledgeTreeNode {
  return { id, name, nodeType: 'file', parentID: 0, path: name } as KnowledgeTreeNode;
}

function mountTree(props: Record<string, any> = {}) {
  return mount(DocumentTree, {
    props: {
      canWrite: true,
      knowledgeId: 7,
      nodes: [fileNode(11, '接入指南.pdf'), fileNode(12, '报文说明.md')],
      ...props,
    },
  });
}

beforeEach(() => {
  apiMocks.retryCompile.mockReset();
  apiMocks.deleteNode.mockReset();
});

describe('documentTree 批量操作条', () => {
  it('只读模式不渲染勾选框，无勾选时不出现批量条', () => {
    const wrapper = mountTree({ canWrite: false });
    expect(wrapper.find('[data-testid="kb-tree-batch-bar"]').exists()).toBe(false);
  });

  it('勾选节点后出现批量条并显示已选数量', async () => {
    const wrapper = mountTree();
    await wrapper.find('[data-test="stub-node-11"]').trigger('click');

    const bar = wrapper.find('[data-testid="kb-tree-batch-bar"]');
    expect(bar.exists()).toBe(true);
    expect(bar.text()).toContain('已选 1 项');
  });

  it('批量重试逐个提交文件重试并上抛数量', async () => {
    apiMocks.retryCompile.mockResolvedValue({});
    const wrapper = mountTree();
    await wrapper.find('[data-test="stub-node-11"]').trigger('click');
    await wrapper.find('[data-test="stub-node-12"]').trigger('click');

    const buttons = wrapper.find('[data-testid="kb-tree-batch-bar"]').findAll('button');
    await buttons.find((button) => button.text() === '批量重试')?.trigger('click');
    await vi.waitFor(() => expect(apiMocks.retryCompile).toHaveBeenCalledTimes(2));

    expect(apiMocks.retryCompile).toHaveBeenNthCalledWith(1, 7, 'all', { documentID: 11 });
    expect(apiMocks.retryCompile).toHaveBeenNthCalledWith(2, 7, 'all', { documentID: 12 });
    expect(wrapper.emitted('batchRetried')?.[0]).toEqual([2]);
    // 提交成功后勾选清空，批量条收起
    expect(wrapper.find('[data-testid="kb-tree-batch-bar"]').exists()).toBe(false);
  });

  it('批量删除确认后逐个删除并上抛节点', async () => {
    apiMocks.deleteNode.mockResolvedValue({ deletedCount: 1 });
    const wrapper = mountTree();
    await wrapper.find('[data-test="stub-node-11"]').trigger('click');

    const bar = wrapper.find('[data-testid="kb-tree-batch-bar"]');
    await bar
      .findAll('button')
      .find((button) => button.text() === '批量删除')
      ?.trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '确认删除')
      ?.trigger('click');
    await vi.waitFor(() => expect(apiMocks.deleteNode).toHaveBeenCalledWith(11));

    expect(wrapper.emitted('batchDeleted')?.[0]?.[0]).toMatchObject([{ id: 11 }]);
    expect(wrapper.find('[data-testid="kb-tree-batch-bar"]').exists()).toBe(false);
  });

  it('取消按钮清空勾选并收起批量条', async () => {
    const wrapper = mountTree();
    await wrapper.find('[data-test="stub-node-11"]').trigger('click');
    expect(wrapper.find('[data-testid="kb-tree-batch-bar"]').exists()).toBe(true);

    await wrapper
      .find('[data-testid="kb-tree-batch-bar"]')
      .findAll('button')
      .find((button) => button.text() === '取消')
      ?.trigger('click');
    expect(wrapper.find('[data-testid="kb-tree-batch-bar"]').exists()).toBe(false);
  });
});

describe('documentTree 空态引导', () => {
  it('整库为空且可写时展示上传引导并上抛空目标上传事件', async () => {
    const wrapper = mountTree({ nodes: [] });

    expect(wrapper.text()).toContain('暂无文档');
    const uploadButton = wrapper.findAll('button').find((button) => button.text().includes('上传文档'));
    expect(uploadButton).toBeTruthy();
    await uploadButton?.trigger('click');
    expect(wrapper.emitted('uploadToFolder')?.[0]).toEqual([null]);
  });

  it('搜索无结果时区分文案并提供清除搜索', async () => {
    const wrapper = mountTree({ keyword: '不存在的文档' });

    expect(wrapper.text()).toContain('没有匹配的文档');
    const clearButton = wrapper.findAll('button').find((button) => button.text() === '清除搜索');
    expect(clearButton).toBeTruthy();
    await clearButton?.trigger('click');
    expect(wrapper.emitted('update:keyword')?.[0]).toEqual(['']);
  });

  it('只读空库不展示上传引导按钮', () => {
    const wrapper = mountTree({ canWrite: false, nodes: [] });

    expect(wrapper.text()).toContain('暂无文档');
    expect(wrapper.findAll('button').find((button) => button.text().includes('上传文档'))).toBeUndefined();
  });
});
