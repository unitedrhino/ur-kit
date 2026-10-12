/** 文件说明：验证图片识别文本兜底、来源边界、请求失败和处理后自动回显。 */
import type { KnowledgeDetail } from '../data';

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import ParsedContent from '../parsed-content.vue';

/** fixture 构造当前图片及其真实类型化识别结果，不依赖网络或模型。 */
function fixture(): KnowledgeDetail {
  return {
    document: { id: 9, knowledgeID: 4, name: '铭牌.png', path: '铭牌.png', nodeType: 'file', parentID: 0 },
    sourceVersion: 'v1',
    multimodalArtifacts: [
      {
        id: 89,
        documentID: 9,
        knowledgeID: 4,
        artifactType: 'image',
        title: '铭牌',
        content: '',
        description: 'DEVICE ZX137，PORT 28830',
        descriptionStatus: 'success',
        sourceVersion: 'v1',
      },
    ],
  };
}

describe('解析文本中的图片识别', () => {
  it('无 OCR 正文时显示视觉描述及非逐字转写提示', () => {
    const wrapper = mount(ParsedContent, { props: { detail: fixture(), text: '' } });
    expect(wrapper.text()).toContain('ZX137');
    expect(wrapper.text()).toContain('非逐字转写');
    expect(wrapper.text()).not.toContain('暂无解析文本');
  });
  it('真实解析正文优先，不被视觉描述替换', () => {
    const wrapper = mount(ParsedContent, { props: { detail: fixture(), text: 'OCR 原始正文' } });
    expect(wrapper.text()).toBe('OCR 原始正文');
  });
  it('新版本和非图片文档不复用旧图片说明', () => {
    for (const detail of [
      { ...fixture(), sourceVersion: 'v2' },
      { ...fixture(), document: { ...fixture().document, path: '说明.pdf' } },
    ]) {
      const wrapper = mount(ParsedContent, { props: { detail, text: '' } });
      expect(wrapper.text()).not.toContain('ZX137');
    }
  });
  it('读取失败不显示假空状态，允许重新读取', async () => {
    const wrapper = mount(ParsedContent, { props: { detail: fixture(), text: '', error: '解析结果加载失败' } });
    expect(wrapper.get('[role="alert"]').text()).toContain('加载失败');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
  it('处理完成后的详情刷新会自动显示识别文本', async () => {
    const wrapper = mount(ParsedContent, {
      props: {
        detail: { ...fixture(), multimodalArtifacts: [], processingStages: [{ stage: 'multimodal', status: 'blocked', message: '缺少图片输入模型' }] },
        text: '',
      },
    });
    expect(wrapper.text()).toContain('缺少图片输入模型');
    await wrapper.setProps({ detail: fixture() });
    expect(wrapper.text()).toContain('ZX137');
  });
});

describe('解析正文引用高亮', () => {
  const text = '第一段介绍。第二段讲设备接入与远程控制。第三段收尾。';

  function bodyFixture() {
    const detail = fixture();
    return { ...detail, document: { ...detail.document, path: '说明.md' } };
  }

  it('高亮区间渲染 mark 并保留前后原文', () => {
    const wrapper = mount(ParsedContent, {
      props: { detail: bodyFixture(), highlight: { charEnd: 14, charStart: 6 }, text },
    });
    const mark = wrapper.find('[data-testid="citation-highlight"]');
    expect(mark.exists()).toBe(true);
    expect(mark.text()).toBe('第二段讲设备接入');
    expect(wrapper.find('[data-testid="parsed-body"]').text()).toBe(text);
  });

  it('无高亮时渲染行为与此前一致，不出现 mark', () => {
    const wrapper = mount(ParsedContent, { props: { detail: bodyFixture(), text } });
    expect(wrapper.find('[data-testid="citation-highlight"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="parsed-body"]').text()).toBe(text);
  });

  it('码点偏移按字符而非字节计算，含 emoji 也能正确切分', () => {
    const emojiText = '🚀开头段落。命中目标句。结尾。';
    const chars = Array.from(emojiText);
    const start = chars.indexOf('命');
    const wrapper = mount(ParsedContent, {
      props: { detail: bodyFixture(), highlight: { charEnd: start + 5, charStart: start }, text: emojiText },
    });
    expect(wrapper.find('[data-testid="citation-highlight"]').text()).toBe('命中目标句');
  });
});
