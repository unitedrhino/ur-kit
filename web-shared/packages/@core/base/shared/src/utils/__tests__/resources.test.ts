import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadScript } from '../resources';

const testJsPath = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';

describe('loadScript', () => {
  // vitest 的 happy-dom 环境默认禁用 JS 文件加载，script 一旦真实连接到 document
  // 会被环境立即派发 error，先于测试手动触发 load。这里把 append 拦截到离屏数组，
  // 元素不进 document 树，从而只验证 loadScript 自身的事件驱动契约。
  let appended: HTMLScriptElement[];

  beforeEach(() => {
    document.head.innerHTML = '';
    appended = [];
    vi.spyOn(document.head, 'append').mockImplementation(((...nodes: Node[]) => {
      appended.push(...(nodes as HTMLScriptElement[]));
    }) as typeof document.head.append);
    // 元素不进 document 树，按 appended 数组模拟 loadScript 内部的去重查询
    vi.spyOn(document, 'querySelector').mockImplementation(((selector: string) => {
      const match = /^script\[src="(.*)"\]$/.exec(selector);
      if (!match) return null;
      return appended.find((el) => el.getAttribute('src') === match[1]) ?? null;
    }) as typeof document.querySelector);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve when the script loads successfully', async () => {
    const promise = loadScript(testJsPath);

    // 脚本元素被创建并交给 head，且未重复插入
    expect(appended).toHaveLength(1);
    const script = appended[0];
    expect(script.getAttribute('src')).toBe(testJsPath);

    // 模拟加载成功
    script.dispatchEvent(new Event('load'));

    // 等待 promise resolve
    await expect(promise).resolves.toBeUndefined();
  });

  it('should not insert duplicate script and resolve immediately if already loaded', async () => {
    // 先登记一个相同 src 的 script，模拟已加载场景
    const existing = document.createElement('script');
    existing.src = 'bar.js';
    appended.push(existing);

    // 再次调用应立即 resolve 且不追加新元素
    const promise = loadScript('bar.js');

    await expect(promise).resolves.toBeUndefined();
    expect(appended).toHaveLength(1);
  });

  it('should reject when the script fails to load', async () => {
    const promise = loadScript('error.js');

    expect(appended).toHaveLength(1);
    const script = appended[0];
    expect(script.getAttribute('src')).toBe('error.js');

    // 模拟加载失败
    script.dispatchEvent(new Event('error'));

    await expect(promise).rejects.toThrow('Failed to load script: error.js');
  });

  it('should handle multiple concurrent calls and only insert one script tag', async () => {
    const p1 = loadScript(testJsPath);
    const p2 = loadScript(testJsPath);

    // 并发调用只创建一次脚本元素
    expect(appended).toHaveLength(1);
    const script = appended[0];

    // 触发一次 load，两个 promise 都应该 resolve
    script.dispatchEvent(new Event('load'));

    await expect(p1).resolves.toBeUndefined();
    await expect(p2).resolves.toBeUndefined();

    expect(appended).toHaveLength(1);
  });
});
