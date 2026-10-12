/** 文件说明：综合阅读的章节、空状态、图片去重和 AI/原文边界回归。 */
import type { KnowledgeArtifact, KnowledgeDetail } from '../data';

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import DocumentReading from '../document-reading.vue';
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
describe('一体化解析阅读', () => {
  it('按概要、正文、媒体、扩展顺序展示并区分来源，概念默认六项', async () => {
    const wrapper = mount(DocumentReading, {
      props: {
        text: '源正文\n第二段',
        detail: {
          ...fixture(),
          summary: artifact('summary'),
          concepts: Array.from({ length: 8 }, (_, i) => artifact('concept', i)),
          multimodalArtifacts: [artifact('table')],
          articles: [artifact('article')],
        },
      },
    });
    expect(wrapper.findAll('[data-section]').map((section) => section.attributes('data-section'))).toEqual(['overview', 'body', 'media', 'articles']);
    expect(wrapper.text()).toContain('源文件内容');
    expect(wrapper.text()).toContain('AI 整理');
    expect(wrapper.get('[data-section="overview"]').text()).not.toContain('产物 7');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '全部 8 个概念')
      ?.trigger('click');
    expect(wrapper.get('[data-section="overview"]').text()).toContain('产物 7');
    expect(wrapper.get('[data-section="articles"] details').attributes('open')).toBeUndefined();
  });
  it('没有适用产物不显示空的概要、媒体和扩展卡片', () => {
    const wrapper = mount(DocumentReading, { props: { text: '原始正文', detail: fixture() } });
    expect(wrapper.findAll('[data-section]').map((section) => section.attributes('data-section'))).toEqual(['body']);
  });
  it('引用高亮区间透传给解析正文并渲染 mark', () => {
    const wrapper = mount(DocumentReading, {
      props: { text: '第一段。第二段命中内容。', detail: fixture(), highlight: { charEnd: 9, charStart: 4 } },
    });
    const mark = wrapper.get('[data-testid="citation-highlight"]');
    expect(mark.text()).toBe('第二段命中');
    expect(wrapper.get('[data-section="body"]').text()).toContain('第一段。');
  });
  it('无 OCR 图片的原图及 AI 描述只出现一次', () => {
    const detail = {
      ...fixture(),
      document: { ...fixture().document, path: '图片.png' },
      multimodalArtifacts: [{ ...artifact('image'), content: '', mediaURI: '/test-image.png', description: '设备图片识别描述', descriptionStatus: 'success' }],
    };
    const wrapper = mount(DocumentReading, { props: { text: '', detail, sourceURL: '/source.png' } });
    expect(wrapper.findAll('img')).toHaveLength(1);
    expect(wrapper.text().split('设备图片识别描述')).toHaveLength(2);
    expect(wrapper.find('[data-section="body"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('不是逐字转写');
  });
  it('配置缺失、读取失败和历史版本明确呈现，入口只发查看事件', async () => {
    const wrapper = mount(DocumentReading, {
      props: {
        text: '',
        error: '读取失败',
        detail: { ...fixture(), summary: { ...artifact('summary'), sourceVersion: 'old' }, processingStages: [{ stage: 'analysis', status: 'blocked' }] },
      },
    });
    expect(wrapper.text()).toContain('缺少配置');
    expect(wrapper.text()).toContain('历史版本');
    expect(wrapper.text()).toContain('读取失败');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '查看详情')
      ?.trigger('click');
    expect(wrapper.emitted('advanced')).toHaveLength(1);
  });
});
