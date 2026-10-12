import { ref, watch } from 'vue';

import { CoreApi } from '@vben/api';
import { i18n } from '@vben/locales';

import { defineStore } from 'pinia';

const MS_PER_DAY = 86_400_000;
// 缓存过期时间：7 天
const CACHE_EXPIRE_TIME = 7 * MS_PER_DAY;

/** 单次拉全量字典分类时的分页上限（一页返回全部分类） */
const DICT_INFO_PAGE_SIZE = 20_000;

export const useDictStore = defineStore(
  'dict',
  () => {
    const dictMap = ref<Record<string, CoreApi.DictDetail[]>>({});
    const cacheByLanguage = ref<Record<string, { map: Record<string, CoreApi.DictDetail[]>; updatedAt: number }>>({});
    const activeLanguage = ref('');
    const lastUpdateTime = ref<number>(0);
    const isInitialized = ref<boolean>(false);
    const isInitializing = ref<boolean>(false);

    let inflightInit: null | Promise<void> = null;
    let inflightLanguage = '';
    let requestVersion = 0;

    /** syncLanguage 切换当前展示缓存，并使旧语言的异步请求失效。 */
    function syncLanguage() {
      const language = i18n.global.locale.value || 'zh-CN';
      if (activeLanguage.value !== language) {
        activeLanguage.value = language;
        const cached = cacheByLanguage.value[language];
        dictMap.value = cached?.map ?? {};
        lastUpdateTime.value = cached?.updatedAt ?? 0;
        isInitialized.value = !!cached;
        isInitializing.value = false;
        inflightInit = null;
        inflightLanguage = '';
        requestVersion++;
      }
      return language;
    }

    watch(() => i18n.global.locale.value, syncLanguage, { flush: 'sync' });

    /**
     * 全量初始化字典（先拉分类列表，再按分类并行拉明细）
     *
     * 不使用 dict/info/get-list 的 withDetail 一次性返回：adcode 分类有 4 万+ 条明细
     * （约 8MB、耗时 20s+），而全局字典用不到它（设备地图等场景走 dict/detail/read 单独读取），
     * 按分类逐个拉取可将耗时与流量降到忽略不计。
     * @param force 是否强制刷新，默认 false
     */
    const initDict = async (force = false) => {
      const language = syncLanguage();
      if (!force && inflightInit && inflightLanguage === language) {
        return inflightInit;
      }

      const now = Date.now();
      const isExpired = now - lastUpdateTime.value > CACHE_EXPIRE_TIME;
      const hasCache = Object.keys(dictMap.value).length > 0;

      // 旧版本缓存（i18nLabel 上线前持久化的数据）缺少 i18nLabel 字段，
      // 视为过期缓存，强制重新拉取，否则多语言展示会一直回退到 label（i18n key）
      const firstErrorDetail = dictMap.value.error?.[0];
      const isLegacyCache = hasCache && !!firstErrorDetail && firstErrorDetail.i18nLabel === undefined;

      if (!force && hasCache && !isExpired && !isLegacyCache) {
        isInitialized.value = true;
        isInitializing.value = false;
        return;
      }

      const run = async () => {
        const version = ++requestVersion;
        isInitializing.value = true;
        try {
          const dictInfoList = await CoreApi.postApiV1SystemDictInfoGetList({
            page: { page: 1, size: DICT_INFO_PAGE_SIZE },
          }, { headers: { 'Accept-Language': language } });

          const codes: string[] = [];
          for (const item of dictInfoList.list || []) {
            const code = item.code;
            if (!code || code === 'adcode') continue;
            codes.push(code);
          }

          // 不传 page 时后端返回该分类全量明细
          const next: Record<string, CoreApi.DictDetail[]> = {};
          await Promise.all(
            codes.map(async (code) => {
              const res = await CoreApi.postApiV1SystemDictDetailGetList({ dictCode: code }, { headers: { 'Accept-Language': language } });
              next[code] = (res.list || []) as CoreApi.DictDetail[];
            }),
          );

          if (version === requestVersion && activeLanguage.value === language) {
            const updatedAt = Date.now();
            dictMap.value = next;
            cacheByLanguage.value[language] = { map: next, updatedAt };
            lastUpdateTime.value = updatedAt;
            isInitialized.value = true;
          }
        } catch (error) {
          if (version === requestVersion) isInitialized.value = false;
          throw error;
        } finally {
          if (version === requestVersion) isInitializing.value = false;
        }
      };

      const p = run();
      if (!force) {
        inflightInit = p;
        inflightLanguage = language;
        void p.then(() => {
          if (inflightInit === p) inflightInit = null;
        }, () => {
          if (inflightInit === p) inflightInit = null;
        });
      }
      return p;
    };

    function setDictMap(dictCode: string, dictList: CoreApi.DictDetail[]) {
      const language = syncLanguage();
      dictMap.value[dictCode] = dictList;
      cacheByLanguage.value[language] = { map: dictMap.value, updatedAt: Date.now() };
    }

    function getDictMap(dictCode: string) {
      syncLanguage();
      if (!isInitialized.value && !isInitializing.value && !inflightInit) {
        void initDict().catch(() => {
          isInitializing.value = false;
        });
      }
      return dictMap.value[dictCode];
    }

    function clearDictCache() {
      dictMap.value = {};
      cacheByLanguage.value = {};
      lastUpdateTime.value = 0;
      isInitialized.value = false;
      isInitializing.value = false;
      inflightInit = null;
      inflightLanguage = '';
      requestVersion++;
    }

    async function refreshDict(dictCode: string) {
      const language = syncLanguage();
      const version = ++requestVersion;
      isInitializing.value = false;
      inflightInit = null;
      const dictList = await CoreApi.postApiV1SystemDictDetailGetList({
        dictCode,
      }, { headers: { 'Accept-Language': language } });
      if (version === requestVersion && activeLanguage.value === language) {
        setDictMap(dictCode, dictList.list || []);
      }
    }

    function $reset() {
      clearDictCache();
    }

    return {
      dictMap,
      cacheByLanguage,
      activeLanguage,
      lastUpdateTime,
      initDict,
      setDictMap,
      getDictMap,
      clearDictCache,
      refreshDict,
      $reset,
    };
  },
  {
    persist: true,
  },
);
