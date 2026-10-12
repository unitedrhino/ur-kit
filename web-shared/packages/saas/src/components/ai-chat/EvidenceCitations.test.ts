import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import EvidenceCitations from './EvidenceCitations.vue';

// ui 基础件用轻桩替身，Popover 桩保留开闭挂点以便断言弹卡内容
vi.mock('@unitedrhino/saas-ui/ui/popover', () => ({
  Popover: {
    props: ['open'],
    template: '<div data-test="stub-popover" :data-open="String(open)"><slot /></div>',
  },
  PopoverTrigger: {
    template: '<div data-test="stub-popover-trigger"><slot /></div>',
  },
  PopoverContent: {
    template: '<div data-test="stub-popover-content"><slot /></div>',
  },
}));

vi.mock('@unitedrhino/saas-ui/ui/badge', () => ({
  Badge: {
    template: '<span data-test="stub-badge"><slot /></span>',
  },
}));

vi.mock('@unitedrhino/saas-ui/ui/button', () => ({
  Button: {
    template: '<button data-test="stub-button" @click="$emit(\'click\')"><slot /></button>',
  },
}));

vi.mock('lucide-vue-next', () => ({
  BookOpen: { template: '<i data-test="stub-icon-book" />' },
  ExternalLink: { template: '<i data-test="stub-icon-link" />' },
}));

const resolveMock = vi.fn((href: string) => ({ href }));
const getRoutesMock = vi.fn(() => [{ path: '/ai-center/knowledge-base' }, { path: '/ai-center/knowledge-base/:id' }]);

vi.mock('vue-router', () => ({
  useRouter: () => ({ getRoutes: getRoutesMock, resolve: resolveMock }),
}));

function newCitation(overrides: Record<string, any> = {}) {
  return {
    knowledgeID: 11,
    documentID: 22,
    documentName: '设备接入指南.pdf',
    path: '手册/接入',
    chunkIndex: 3,
    score: 0.875,
    content: '第一步：创建产品并记录接入密钥。',
    sourceType: 'direct',
    ...overrides,
  };
}

describe('evidenceCitations 证据 chip 与弹卡', () => {
  it('无证据时整体不渲染', () => {
    const wrapper = mount(EvidenceCitations, { props: {} });
    expect(wrapper.find('[data-testid="ai-evidence-citations"]').exists()).toBe(false);
  });

  it('直接命中在前、关联补充在后，chip 序号连续', () => {
    const wrapper = mount(EvidenceCitations, {
      props: {
        citations: [newCitation()],
        expandedCitations: [newCitation({ sourceType: 'related', documentName: '报文说明.md' })],
      },
    });

    const chips = wrapper.findAll('[data-testid="ai-evidence-chip"]');
    expect(chips).toHaveLength(2);
    expect(chips[0]?.text()).toContain('设备接入指南.pdf');
    expect(chips[1]?.text()).toContain('报文说明.md');
  });

  it('悬浮 chip 打开弹卡并展示切片原文、文档名与分数', async () => {
    const wrapper = mount(EvidenceCitations, {
      props: { citations: [newCitation()] },
    });

    const chip = wrapper.find('[data-testid="ai-evidence-chip"]');
    await chip.trigger('mouseenter');

    const content = wrapper.find('[data-test="stub-popover-content"]');
    expect(content.exists()).toBe(true);
    expect(content.text()).toContain('设备接入指南.pdf');
    expect(content.text()).toContain('手册/接入');
    expect(content.text()).toContain('切片 #3');
    expect(content.text()).toContain('0.88');
    expect(content.text()).toContain('直接命中');
    expect(content.text()).toContain('第一步：创建产品并记录接入密钥。');
  });

  it('弹卡打开时 chip 对应 Popover 状态为 open', async () => {
    const wrapper = mount(EvidenceCitations, {
      props: { citations: [newCitation()] },
    });

    expect(wrapper.find('[data-test="stub-popover"]').attributes('data-open')).toBe('false');
    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('mouseenter');
    expect(wrapper.find('[data-test="stub-popover"]').attributes('data-open')).toBe('true');
  });

  it('点击 chip 按工作台路由打开文档并携带切片定位参数', async () => {
    const openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);

    const wrapper = mount(EvidenceCitations, {
      props: { citations: [newCitation()] },
    });

    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('click');
    expect(resolveMock).toHaveBeenCalledWith('/ai-center/knowledge-base/11?doc=22&chunk=3&q=%E7%AC%AC%E4%B8%80%E6%AD%A5%EF%BC%9A%E5%88%9B%E5%BB%BA%E4%BA%A7%E5%93%81%E5%B9%B6%E8%AE%B0%E5%BD%95%E6%8E%A5%E5%85%A5%E5%AF%86%E9%92%A5%E3%80%82');
    expect(openSpy).toHaveBeenCalledWith(
      '/ai-center/knowledge-base/11?doc=22&chunk=3&q=%E7%AC%AC%E4%B8%80%E6%AD%A5%EF%BC%9A%E5%88%9B%E5%BB%BA%E4%BA%A7%E5%93%81%E5%B9%B6%E8%AE%B0%E5%BD%95%E6%8E%A5%E5%85%A5%E5%AF%86%E9%92%A5%E3%80%82',
      '_blank',
      'noopener,noreferrer',
    );
    vi.unstubAllGlobals();
  });

  it('携带页码与偏移时透传 PDF 定位先验参数', async () => {
    const openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);

    const wrapper = mount(EvidenceCitations, {
      props: {
        citations: [newCitation({ charStart: 40, charEnd: 64, pageIdx: 2, content: undefined })],
      },
    });

    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('click');
    const href = openSpy.mock.calls[0]?.[0] as string;
    expect(href).toContain('pi=2');
    expect(href).toContain('cs=40');
    expect(href).toContain('ce=64');
    vi.unstubAllGlobals();
  });

  it('证据缺少 documentID 时只跳工作台不带定位参数', async () => {
    const openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);

    const wrapper = mount(EvidenceCitations, {
      props: { citations: [newCitation({ documentID: undefined })] },
    });

    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('click');
    expect(openSpy).toHaveBeenCalledWith('/ai-center/knowledge-base/11', '_blank', 'noopener,noreferrer');
    vi.unstubAllGlobals();
  });

  it('当前应用没有工作台路由时不渲染跳转按钮，点击不再抛错', async () => {
    getRoutesMock.mockReturnValueOnce([{ path: '/other/page' }]);
    const openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);

    const wrapper = mount(EvidenceCitations, {
      props: { citations: [newCitation()] },
    });

    expect(wrapper.text()).not.toContain('打开文档');
    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('click');
    expect(openSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('超长切片原文在弹卡中截断', () => {
    const wrapper = mount(EvidenceCitations, {
      props: {
        citations: [newCitation({ content: '长'.repeat(800) })],
      },
    });

    const chip = wrapper.find('[data-testid="ai-evidence-chip"]');
    void chip.trigger('mouseenter');
    const content = wrapper.find('[data-test="stub-popover-content"]');
    expect(content.text()).toContain('…');
    expect(content.text().length).toBeLessThan(700);
  });

  it('关联补充弹卡展示关系判定依据、类型与关系分', async () => {
    const wrapper = mount(EvidenceCitations, {
      props: {
        expandedCitations: [
          newCitation({
            sourceType: 'related',
            relationType: 'reference',
            relationEvidence: '目标切片引用了源切片定义的上报 Topic 格式',
            relationScore: 0.87,
          }),
        ],
      },
    });

    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('mouseenter');
    const relation = wrapper.find('[data-testid="ai-evidence-relation"]');
    expect(relation.exists()).toBe(true);
    expect(relation.text()).toContain('关联依据');
    expect(relation.text()).toContain('目标切片引用了源切片定义的上报 Topic 格式');
    expect(relation.text()).toContain('引用');
    expect(relation.text()).toContain('关系分 0.87');
  });

  it('关联补充缺少判定依据时仍显示类型并回退关系分', async () => {
    const wrapper = mount(EvidenceCitations, {
      props: {
        expandedCitations: [newCitation({ sourceType: 'related', relationType: 'similar', score: 0.75 })],
      },
    });

    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('mouseenter');
    const relation = wrapper.find('[data-testid="ai-evidence-relation"]');
    expect(relation.exists()).toBe(true);
    expect(relation.text()).toContain('—');
    expect(relation.text()).toContain('相似');
    expect(relation.text()).toContain('关系分 0.75');
  });

  it('直接命中弹卡不展示关联依据区', async () => {
    const wrapper = mount(EvidenceCitations, {
      props: { citations: [newCitation()] },
    });

    await wrapper.find('[data-testid="ai-evidence-chip"]').trigger('mouseenter');
    expect(wrapper.find('[data-testid="ai-evidence-relation"]').exists()).toBe(false);
  });
});
