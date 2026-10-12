/** 文件说明：验证字典缓存按语言隔离，且迟到的旧语言请求不能回填当前界面。 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { CoreApi } from '@vben/api';
import { i18n } from '@vben/locales';

import { useDictStore } from '../dict';

vi.mock('@vben/api', () => ({
  CoreApi: {
    postApiV1SystemDictInfoGetList: vi.fn(),
    postApiV1SystemDictDetailGetList: vi.fn(),
  },
}));

const infoList = vi.mocked(CoreApi.postApiV1SystemDictInfoGetList);
const detailList = vi.mocked(CoreApi.postApiV1SystemDictDetailGetList);

beforeEach(() => {
  setActivePinia(createPinia());
  i18n.global.locale.value = 'zh-CN';
  vi.resetAllMocks();
  infoList.mockResolvedValue({ list: [{ code: 'status' }] } as any);
});

describe('字典语言缓存', () => {
  it('同一编码按语言返回不同展示值，切回时复用对应缓存', async () => {
    detailList.mockImplementation(async (_req, config) => ({
      list: [{ id: '11', value: '1', label: '启用', i18nLabel: config?.headers?.['Accept-Language'] === 'en-US' ? 'Enabled' : '启用' }],
    } as any));
    const store = useDictStore();
    await store.initDict();
    expect(store.getDictMap('status')?.[0]?.i18nLabel).toBe('启用');
    i18n.global.locale.value = 'en-US';
    await store.initDict();
    expect(store.getDictMap('status')?.[0]?.i18nLabel).toBe('Enabled');
    i18n.global.locale.value = 'zh-CN';
    expect(store.getDictMap('status')?.[0]?.i18nLabel).toBe('启用');
    expect(detailList).toHaveBeenCalledTimes(2);
  });

  it('旧语言请求迟到时不得覆盖新语言缓存', async () => {
    let finishOld: ((value: any) => void) | undefined;
    detailList.mockImplementation((_req, config) => {
      if (config?.headers?.['Accept-Language'] === 'zh-CN') {
        return new Promise((resolve) => { finishOld = resolve; });
      }
      return Promise.resolve({ list: [{ label: '启用', i18nLabel: 'Enabled', value: '1' }] } as any);
    });
    const store = useDictStore();
    const old = store.initDict();
    await vi.waitFor(() => expect(finishOld).toBeTypeOf('function'));
    i18n.global.locale.value = 'en-US';
    await store.initDict();
    finishOld?.({ list: [{ label: '启用', i18nLabel: '启用', value: '1' }] });
    await old;
    expect(store.getDictMap('status')?.[0]?.i18nLabel).toBe('Enabled');
  });
});
