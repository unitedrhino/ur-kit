/**
 * 文件说明：来源依据（Sources）切片的渲染与跳转回归——
 * 切片正文复用解析正文渲染管道（mermaid 成图），切片标识行可点击跳回原文定位。
 */
import type { KnowledgeArtifact, KnowledgeDetail } from '../data';

import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import DocumentReading from '../document-reading.vue';

const routerMock = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerMock.push }) }));

const mermaidMock = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }));
vi.mock('mermaid', () => ({ default: mermaidMock }));

/** 当前版本的合成文档及不适用阶段，不依赖模型。 */
function fixture(): KnowledgeDetail {
  return {
    document: { id: 1, knowledgeID: 2, parentID: 0, nodeType: 'file', name: '说明.md', path: '说明.md' },
    sourceVersion: 'v1',
    processingStages: ['content', 'analysis', 'multimodal'].map((stage) => ({ stage, status: 'notApplicable', sourceVersion: 'v1' })),
  };
}
/** 产物生成方法显式标明 AI，防止测试夹具暗示其为原文。 */
function artifact(artifactType: KnowledgeArtifact['artifactType'], id = 1): KnowledgeArtifact {
  return { id, knowledgeID: 2, documentID: 1, artifactType, title: `产物 ${id}`, content: 'AI 整理内容', sourceVersion: 'v1', generationMethod: 'ai' };
}

/** 带来源依据的文档：一个切片含 mermaid 围栏，位于当前文档。 */
function sourceDetail(options?: { charEnd?: number; charStart?: number; content?: string; documentID?: number; pageIdx?: number }): KnowledgeDetail {
  const source = {
    documentID: options?.documentID ?? 1,
    artifactID: 11,
    charStart: options?.charStart,
    charEnd: options?.charEnd,
    pageIdx: options?.pageIdx ?? 0,
    headingPath: '流程图说明',
    sourceVersion: options?.documentID && options.documentID !== 1 ? undefined : 'v1',
  };
  const slice = {
    ...artifact('chunk', 11),
    content: options?.content ?? '第一步：注册产品并获取 ProductID。',
    generationMethod: 'source' as const,
  };
  return {
    ...fixture(),
    chunks: [slice],
    articles: [{ ...artifact('article'), sources: [source] }],
  };
}

/** mountSources 打开扩展阅读与来源依据折叠块，返回组件包装。 */
async function mountSources(detail: KnowledgeDetail) {
  const wrapper = mount(DocumentReading, { props: { text: '源正文', detail } });
  const summaries = wrapper.findAll('summary');
  const sourcesSummary = summaries[summaries.length - 1];
  if (!sourcesSummary) throw new Error('来源依据折叠块未渲染');
  await sourcesSummary.trigger('click');
  return wrapper;
}

/** sourcesBlock 取来源依据折叠块的作用域。 */
function sourcesBlock(wrapper: Awaited<ReturnType<typeof mountSources>>) {
  const block = wrapper.findAll('details').at(-1);
  if (!block) throw new Error('来源依据折叠块未渲染');
  return block;
}

describe('来源依据切片渲染', () => {
  beforeEach(() => {
    mermaidMock.initialize.mockReset();
    mermaidMock.render.mockReset();
    mermaidMock.render.mockResolvedValue({ svg: '<svg><circle/></svg>' });
  });

  it('切片正文复用解析正文渲染管道：mermaid 围栏成图，围栏符号不外露', async () => {
    const content = '接入说明如下:\n```mermaid\ngraph TD\n  A[设备接入] --> B{协议类型}\n```\n完成。';
    const wrapper = await mountSources(sourceDetail({ content }));
    const block = sourcesBlock(wrapper);
    await flushPromises();
    expect(block.find('[data-testid="kb-mermaid-figure"]').exists()).toBe(true);
    expect(block.text()).not.toContain('```mermaid');
    expect(block.text()).toContain('接入说明如下:');
    wrapper.unmount();
  });
});

describe('来源依据切片跳转', () => {
  beforeEach(() => {
    routerMock.push.mockReset();
    mermaidMock.initialize.mockReset();
    mermaidMock.render.mockReset();
  });

  it('同文档切片点击标识行切回解析阅读并按区间定位', async () => {
    const wrapper = await mountSources(sourceDetail({ charStart: 8, charEnd: 18, pageIdx: 0 }));
    const button = sourcesBlock(wrapper).find('button');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    expect(routerMock.push).toHaveBeenCalledTimes(1);
    expect(routerMock.push.mock.calls[0]?.[0]).toEqual({
      query: { doc: '1', cs: '8', ce: '18', pi: '0', q: '第一步：注册产品并获取 ProductID。' },
    });
    wrapper.unmount();
  });

  it('跨文档切片按 URL 参数跳转到目标文档', async () => {
    const wrapper = await mountSources(sourceDetail({ documentID: 7, pageIdx: 1 }));
    const block = sourcesBlock(wrapper);
    expect(block.text()).toContain('该证据已失效或不在当前可见文档中');
    await block.find('button').trigger('click');
    expect(routerMock.push).toHaveBeenCalledTimes(1);
    expect(routerMock.push.mock.calls[0]?.[0]).toEqual({ query: { doc: '7', pi: '1' } });
    wrapper.unmount();
  });

  it('区间缺失或为零时退化为仅页码定位参数', async () => {
    const wrapper = await mountSources(sourceDetail({ charStart: 0, charEnd: 0, pageIdx: 2 }));
    await sourcesBlock(wrapper).find('button').trigger('click');
    // 区间未进参数，但同文档切片正文仍作引文兜底，T3 判定可精确命中。
    expect(routerMock.push.mock.calls[0]?.[0]).toEqual({ query: { doc: '1', pi: '2', q: '第一步：注册产品并获取 ProductID。' } });
    wrapper.unmount();
  });
});
