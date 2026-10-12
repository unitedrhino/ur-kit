// 验证重型资源按操作加载、并发去重及失败重试。
import { describe, expect, it, vi } from 'vitest';
import { createLazyResource } from '../lazy-resource';

describe('按操作加载资源', () => {
  it('首次调用前不加载，并发调用共享结果', async () => {
    const importer = vi.fn(async () => ({ value: 1 }));
    const load = createLazyResource(importer);
    expect(importer).not.toHaveBeenCalled();
    const first = load();
    expect(load()).toBe(first);
    expect(await first).toEqual({ value: 1 });
    expect(await load()).toBe(await first);
    expect(importer).toHaveBeenCalledTimes(1);
  });
  it('失败返回调用方，下一次操作可以重试', async () => {
    const importer = vi.fn().mockRejectedValueOnce(new Error('断网')).mockResolvedValue('ok');
    const load = createLazyResource(importer);
    await expect(load()).rejects.toThrow('断网');
    await expect(load()).resolves.toBe('ok');
    expect(importer).toHaveBeenCalledTimes(2);
  });
});
