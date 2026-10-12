/**
 * 文件说明：验证解析正文 mermaid 围栏分段与图表渲染失败回退。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import MermaidBlock from '../components/mermaid-block.vue';
import { splitMermaidSegments } from '../mermaid-segments';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));
vi.mock('mermaid', () => ({ default: mermaidMock }));

describe('mermaid 围栏分段', () => {
  /** 验收环境「流程图说明.md」的真实解析正文（get-content parsedFullText 原样内容）。 */
  const realParsedFullText = [
    '流程图说明',
    '以下是接入流程图:',
    '```mermaid',
    'graph TD',
    '  A[设备接入] --> B{协议类型}',
    '  B -->|MQTT| C[内置网关]',
    '  B -->|CoAP| D[边缘网关]',
    '  C --> E[平台]',
    '  D --> E',
    '```',
    '完成。',
  ].join('\n');

  it('真实文档：围栏前有标题行时切出前中后三段，围栏不进正文', () => {
    expect(splitMermaidSegments(realParsedFullText)).toEqual([
      { type: 'text', value: '流程图说明\n以下是接入流程图:\n', start: 0 },
      {
        type: 'mermaid',
        code: 'graph TD\n  A[设备接入] --> B{协议类型}\n  B -->|MQTT| C[内置网关]\n  B -->|CoAP| D[边缘网关]\n  C --> E[平台]\n  D --> E',
        start: 16,
      },
      { type: 'text', value: '\n完成。', start: 129 },
    ]);
  });

  it('无围栏时整段为单一文本段', () => {
    expect(splitMermaidSegments('普通正文第一段')).toEqual([{ type: 'text', value: '普通正文第一段', start: 0 }]);
  });

  it('围栏块拆分为文本与 mermaid 段，标记行不进入正文', () => {
    const segments = splitMermaidSegments('前文说明\n```mermaid\ngraph TD; A-->B;\n```\n后文说明');
    expect(segments).toEqual([
      { type: 'text', value: '前文说明\n', start: 0 },
      { type: 'mermaid', code: 'graph TD; A-->B;', start: 5 },
      { type: 'text', value: '\n后文说明', start: 36 },
    ]);
  });

  it('段起点按码点累计，emoji 等代理对字符占一个码点', () => {
    const segments = splitMermaidSegments('🚀前文\n```mermaid\ngraph TD;\n```\n后文');
    expect(segments).toEqual([
      { type: 'text', value: '🚀前文\n', start: 0 },
      { type: 'mermaid', code: 'graph TD;', start: 4 },
      { type: 'text', value: '\n后文', start: 28 },
    ]);
  });

  it('未闭合的 mermaid 开头保持原文不渲染', () => {
    const text = '```mermaid\ngraph TD; A-->B;';
    expect(splitMermaidSegments(text)).toEqual([{ type: 'text', value: text, start: 0 }]);
  });

  it('空代码块与普通代码围栏不按图表处理', () => {
    const empty = splitMermaidSegments('```mermaid\n\n```');
    expect(empty).toEqual([{ type: 'text', value: '```mermaid\n\n```', start: 0 }]);
    const plain = splitMermaidSegments('```js\nconst a = 1;\n```');
    expect(plain).toEqual([{ type: 'text', value: '```js\nconst a = 1;\n```', start: 0 }]);
  });
});

describe('mermaid 渲染组件', () => {
  beforeEach(() => {
    mermaidMock.initialize.mockReset();
    mermaidMock.render.mockReset();
  });

  it('渲染成功显示图表 SVG', async () => {
    mermaidMock.render.mockResolvedValue({ svg: '<svg><circle/></svg>' });
    const wrapper = mount(MermaidBlock, { props: { code: 'graph TD; A-->B;' } });
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="kb-mermaid-figure"]').exists()).toBe(true);
    });
    expect(wrapper.find('[data-testid="kb-mermaid-figure"]').html()).toContain('<circle');
    expect(wrapper.find('[data-testid="kb-mermaid-code"]').exists()).toBe(false);
  });

  it('渲染或库加载失败退回代码块展示', async () => {
    mermaidMock.render.mockRejectedValue(new Error('语法错误'));
    const wrapper = mount(MermaidBlock, { props: { code: 'graph TD; A-->B;' } });
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="kb-mermaid-code"]').exists()).toBe(true);
    });
    expect(wrapper.find('[data-testid="kb-mermaid-code"]').text()).toBe('graph TD; A-->B;');
    expect(wrapper.find('[data-testid="kb-mermaid-figure"]').exists()).toBe(false);
  });

  it('真实缺陷回归：render 返回 sandbox iframe 产物时不吞正文，退回代码块', async () => {
    // sandbox securityLevel 的 render 会 resolve 出 data:-URL iframe；受 CSP 限制的环境里它整体不可见，
    // 若照单全收会导致围栏内容"无 SVG 也无代码块"静默消失（验收环境实测缺陷）。
    const sandboxIframe = '<iframe style="width:100%;height:470px;border:0;" src="data:text/html;charset=UTF-8;base64,PGJvZHk+"></iframe>';
    mermaidMock.render.mockResolvedValue({ svg: sandboxIframe });
    const wrapper = mount(MermaidBlock, { props: { code: 'graph TD\n  A[设备接入] --> B{协议类型}' } });
    await flushPromises();
    await flushPromises();
    expect(wrapper.find('[data-testid="kb-mermaid-figure"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="kb-mermaid-code"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="kb-mermaid-code"]').text()).toBe('graph TD\n  A[设备接入] --> B{协议类型}');
  });

  it('render 返回空产物同样退回代码块', async () => {
    mermaidMock.render.mockResolvedValue({ svg: '' });
    const wrapper = mount(MermaidBlock, { props: { code: 'graph TD; A-->B;' } });
    await flushPromises();
    await flushPromises();
    expect(wrapper.find('[data-testid="kb-mermaid-figure"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="kb-mermaid-code"]').exists()).toBe(true);
  });
});
