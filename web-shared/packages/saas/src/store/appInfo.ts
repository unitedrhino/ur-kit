import { ref } from 'vue';
import { defineStore } from 'pinia';

import { CoreApi } from '@vben/api';

export const useAppInfoStore = defineStore(
  'appInfo',
  () => {
    const appInfoList = ref<CoreApi.AppInfo[]>([]);

    function updateAppInfoList(list: CoreApi.AppInfo[]) {
      appInfoList.value = list;
    }

    function updateSingleAppInfo(appInfo: CoreApi.AppInfo) {
      if (appInfoList.value.find((item) => item.id === appInfo.id)) {
        appInfoList.value = appInfoList.value.map((item) => item.id === appInfo.id ? appInfo : item);
      } else {
        appInfoList.value.push(appInfo);
      }
    }

    async function getAppInfo(appId: string, withAgreementCodes: string[] = [], force = false) : Promise<CoreApi.AppInfo> {
      // force 时跳过 pinia 持久化缓存：应用后台改了头像/名称后，
      // localStorage 里的旧记录不会覆盖最新配置
      const appInfo = force ? undefined : appInfoList.value.find((item) => item.id === appId);

      if(!appInfo || withAgreementCodes.length > 0) {
        //无需登录获取应用信息
        // /api/v1/system/app/core/get-one
        const res = await CoreApi.postApiV1SystemAppCoreGetOne({
          id: appId,
          withAgreementCodes: withAgreementCodes.length > 0 ? withAgreementCodes : undefined,
        });
        if(res) {
          updateSingleAppInfo(res);
        }
        return res || {};
      }
      return appInfo;
    }

    function $reset() {
      appInfoList.value = [];
    }

    return {
      appInfoList,
      updateAppInfoList,
      updateSingleAppInfo,
      getAppInfo,
      $reset,
    };
  },
  {
    persist: true,
  },
);
