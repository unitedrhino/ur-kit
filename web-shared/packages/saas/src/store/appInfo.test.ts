import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// mock @vben/api， getAppInfo 依赖应用信息接口
vi.mock('@vben/api', () => ({
  CoreApi: {
    postApiV1SystemAppCoreGetOne: vi.fn(),
  },
}));

import { CoreApi } from '@vben/api';
import { useAppInfoStore } from './appInfo';

const mockedGetOne = vi.mocked(CoreApi.postApiV1SystemAppCoreGetOne);

beforeEach(() => {
  setActivePinia(createPinia());
  mockedGetOne.mockReset();
});

describe('appInfo store', () => {
  it('缓存未命中时请求接口并写入列表', async () => {
    const appInfo = { id: '77', name: '控制台' } as any;
    mockedGetOne.mockResolvedValue(appInfo as any);
    const store = useAppInfoStore();

    const result = await store.getAppInfo('77');

    expect(result).toEqual(appInfo);
    expect(store.appInfoList).toHaveLength(1);
    expect(store.appInfoList[0]).toEqual(appInfo);
    expect(mockedGetOne).toHaveBeenCalledWith({ id: '77', withAgreementCodes: undefined });
  });

  it('缓存命中时直接返回不请求接口', async () => {
    const store = useAppInfoStore();
    store.updateAppInfoList([{ id: '77', name: '控制台' } as any]);

    const result = await store.getAppInfo('77');

    expect(result).toEqual({ id: '77', name: '控制台' });
    expect(mockedGetOne).not.toHaveBeenCalled();
  });

  it('force 或携带协议编码时绕过缓存重新请求', async () => {
    const fresh = { id: '77', name: '控制台-新头像' } as any;
    mockedGetOne.mockResolvedValue(fresh as any);
    const store = useAppInfoStore();
    store.updateAppInfoList([{ id: '77', name: '控制台' } as any]);

    await store.getAppInfo('77', [], true);
    expect(mockedGetOne).toHaveBeenCalledTimes(1);
    // 列表内同 id 应用被替换更新而非追加
    expect(store.appInfoList).toHaveLength(1);
    expect(store.appInfoList[0].name).toBe('控制台-新头像');

    await store.getAppInfo('77', ['user-agreement']);
    expect(mockedGetOne).toHaveBeenCalledTimes(2);
    expect(mockedGetOne).toHaveBeenLastCalledWith({ id: '77', withAgreementCodes: ['user-agreement'] });
  });

  it('updateSingleAppInfo 对新应用执行追加', () => {
    const store = useAppInfoStore();
    store.updateSingleAppInfo({ id: '77', name: '控制台' } as any);
    store.updateSingleAppInfo({ id: '88', name: '物联网' } as any);
    expect(store.appInfoList.map((item) => item.id)).toEqual(['77', '88']);
  });

  it('$reset 清空应用列表', async () => {
    mockedGetOne.mockResolvedValue({ id: '77' } as any);
    const store = useAppInfoStore();
    await store.getAppInfo('77');
    store.$reset();
    expect(store.appInfoList).toHaveLength(0);
  });

  it('接口返回空时返回空对象且不写入列表', async () => {
    mockedGetOne.mockResolvedValue(undefined as any);
    const store = useAppInfoStore();
    const result = await store.getAppInfo('404');
    expect(result).toEqual({});
    expect(store.appInfoList).toHaveLength(0);
  });
});
