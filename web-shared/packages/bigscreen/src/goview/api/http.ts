/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { RequestParamsObjType } from '@/enums/httpEnum';
import type { RequestConfigType, RequestGlobalConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

import { ContentTypeEnum, RequestBodyEnum, RequestContentTypeEnum, RequestDataTypeEnum, RequestHttpEnum } from '@/enums/httpEnum';
import { isUnsafeUrl } from '@/utils/urlSecurity';

import axiosInstance from './axios';

export const get = (url: string, params?: object) => {
  return axiosInstance({
    url,
    method: RequestHttpEnum.GET,
    params,
  });
};

export const post = (url: string, data?: object, headersType?: string) => {
  return axiosInstance({
    url,
    method: RequestHttpEnum.POST,
    data,
    headers: {
      'Content-Type': headersType || ContentTypeEnum.JSON,
    },
  });
};

export const patch = (url: string, data?: object, headersType?: string) => {
  return axiosInstance({
    url,
    method: RequestHttpEnum.PATCH,
    data,
    headers: {
      'Content-Type': headersType || ContentTypeEnum.JSON,
    },
  });
};

export const put = (url: string, data?: object, headersType?: ContentTypeEnum) => {
  return axiosInstance({
    url,
    method: RequestHttpEnum.PUT,
    data,
    headers: {
      'Content-Type': headersType || ContentTypeEnum.JSON,
    },
  });
};

export const del = (url: string, params?: object) => {
  return axiosInstance({
    url,
    method: RequestHttpEnum.DELETE,
    params,
  });
};

export const http = (type?: RequestHttpEnum) => {
  switch (type) {
    case RequestHttpEnum.DELETE: {
      return del;
    }

    case RequestHttpEnum.GET: {
      return get;
    }

    case RequestHttpEnum.PATCH: {
      return patch;
    }

    case RequestHttpEnum.POST: {
      return post;
    }

    case RequestHttpEnum.PUT: {
      return put;
    }

    default: {
      return get;
    }
  }
};

const prefix = 'javascript:';
const SANDBOX_TIMEOUT = 3000;

interface SandboxWorkerResult {
  error?: string;
  result?: any;
  success?: boolean;
  taskId?: number;
}

const sandboxEval = async (code: string): Promise<any> => {
  if (typeof Worker === 'undefined') {
    throw new Error('Sandbox execution is unavailable');
  }

  return new Promise((resolve, reject) => {
    const taskId = Date.now();
    const worker = new Worker(new URL('../utils/sandbox.worker.ts', import.meta.url), { type: 'module' });
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error('Sandbox execution timed out'));
    }, SANDBOX_TIMEOUT);

    worker.onmessage = (event: MessageEvent<SandboxWorkerResult>) => {
      const data = event.data;
      if (data.taskId !== taskId) return;

      clearTimeout(timer);
      worker.terminate();

      if (data.success) {
        resolve(data.result);
      } else {
        reject(new Error(data.error || 'Sandbox execution failed'));
      }
    };

    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error('Sandbox execution failed'));
    };

    worker.postMessage({
      taskId,
      data: undefined,
      funcStr: `return (${code})`,
      res: undefined,
    });
  });
};

export const translateStr = async (target: any): Promise<any> => {
  if (typeof target === 'string') {
    if (!target.startsWith(prefix)) {
      return target;
    }

    const funcStr = target.slice(prefix.length);
    try {
      return await sandboxEval(funcStr);
    } catch (error) {
      console.warn('[translateStr] 表达式解析失败:', error);
      window.$message.error(editorT('bigscreenEditor.ui.helperInvalidJavascriptExpression'));
      return undefined;
    }
  }

  if (!target || typeof target !== 'object') {
    return target;
  }

  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = await translateStr(target[key]);
    }
  }

  return target;
};

/**
 * 自定义请求
 * @param targetParams 当前组件参数
 * @param globalParams 全局参数
 */
export const customizeHttp = async (targetParams: RequestConfigType, globalParams: RequestGlobalConfigType) => {
  if (!targetParams || !globalParams) {
    return;
  }

  const {
    requestOriginUrl,
    requestParams: globalRequestParams,
  } = globalParams;

  const {
    requestUrl,
    requestContentType,
    requestDataType,
    requestHttpType,
    requestParamsBodyType,
    requestSQLContent,
    requestParams: targetRequestParams,
  } = targetParams;

  if (requestDataType === RequestDataTypeEnum.STATIC) return;
  if (!requestUrl) return;

  let headers: RequestParamsObjType = {
    ...globalRequestParams.Header,
    ...targetRequestParams.Header,
  };
  headers = await translateStr(headers);

  let data: FormData | RequestParamsObjType | string = {};
  let params: RequestParamsObjType = { ...targetRequestParams.Params };
  params = await translateStr(params);

  const formData = new FormData();

  switch (requestParamsBodyType) {
    case RequestBodyEnum.FORM_DATA: {
      headers['Content-Type'] = ContentTypeEnum.FORM_DATA;
      const bodyFormUrlencoded = targetRequestParams.Body['form-data'];
      for (const i in bodyFormUrlencoded) {
        formData.set(i, String(await translateStr(bodyFormUrlencoded[i])));
      }
      data = formData;
      break;
    }

    case RequestBodyEnum.JSON: {
      headers['Content-Type'] = ContentTypeEnum.JSON;
      data = await translateStr(targetRequestParams.Body.json);
      if (typeof data === 'string') data = JSON.parse(data);
      break;
    }

    case RequestBodyEnum.NONE: {
      break;
    }

    case RequestBodyEnum.X_WWW_FORM_URLENCODED: {
      headers['Content-Type'] = ContentTypeEnum.FORM_URLENCODED;
      const bodyFormData = targetRequestParams.Body['x-www-form-urlencoded'];
      for (const i in bodyFormData) {
        formData.set(i, String(await translateStr(bodyFormData[i])));
      }
      data = formData;
      break;
    }

    case RequestBodyEnum.XML: {
      headers['Content-Type'] = ContentTypeEnum.XML;
      data = await translateStr(targetRequestParams.Body.xml);
      break;
    }
  }

  if (requestContentType === RequestContentTypeEnum.SQL) {
    headers['Content-Type'] = ContentTypeEnum.JSON;
    data = requestSQLContent;
  }

  try {
    const url = `${requestOriginUrl || ''}${requestUrl}`.trim();
    if (!url) {
      window.$message.error(editorT('bigscreenEditor.ui.helperUrlIsEmpty'));
      return;
    }
    if (isUnsafeUrl(url)) {
      window.$message.error(editorT('bigscreenEditor.ui.helperDynamicRequestsCannotTargetLocalOrPrivateNetworkAddresses'));
      return;
    }

    return axiosInstance({
      url,
      method: requestHttpType,
      data,
      params,
      headers,
    });
  } catch (error) {
    console.warn('[customizeHttp] 请求失败:', error);
    window.$message.error(editorT('bigscreenEditor.ui.helperInvalidUrlFormat'));
  }
};
