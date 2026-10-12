import { getRequestClient } from '@vben/api';
import type { CoreApi } from '@vben/api';

interface UploadFileParams {
  file: File;
  ithingsProjectId?: string;
  ithingsToken?: string;
  appCode?: string;
  deviceId?: string;
  tenantCode?: string;
  business?: string;
  scene?: string;
}

export async function uploadFile(file: File, params?: Omit<UploadFileParams, 'file'>) {
  const requestClient = getRequestClient();
  const uploadData: Record<string, any> & { file: File | Blob } = {
    file,
    ...params,
  };

  const response = await requestClient.upload('/api/v1/system/common/upload-file', uploadData);

  return response;
}

/**
 * 解析上传结果中可供后端 batch-import（FromZip/FileUrlToFilePath）使用的 OSS 地址。
 * 批量导入必须传 fileUri（完整 URL），不能仅传相对 filePath。
 */
export function resolveUploadFileUrl(
  resp: Pick<CoreApi.UploadFileResp, 'fileUri' | 'filePath'>,
): string {
  return (resp.fileUri || resp.filePath || '').trim();
}

/**
 * 上传批量导入 ZIP，返回后端可识别的 OSS 文件地址。
 * @param file ZIP 文件
 * @param business 业务标识（如 product、category、schema）
 */
export async function uploadBatchImportFile(file: File, business: string): Promise<string> {
  const resp = (await uploadFile(file, { business })) as CoreApi.UploadFileResp;
  const url = resolveUploadFileUrl(resp);
  if (!url) {
    throw new Error('上传成功但未返回文件地址');
  }
  return url;
}

/**
 * 下载批量导出接口返回的 OSS 文件地址。
 * 外部 COS/Minio 签名 URL 受 CORS 限制，不能使用 fetch，需通过锚点跳转触发浏览器下载。
 * @param fileUrl 导出接口返回的文件地址（通常为 OSS 签名 URL）
 * @param fileName 本地下载文件名
 */
export function downloadExportFileUrl(fileUrl: string, fileName: string): void {
  const url = (fileUrl || '').trim();
  if (!url) {
    throw new Error('未返回文件地址');
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export async function uploadFileInit(file: File, params?: Omit<UploadFileParams, 'file'>) {
  const requestClient = getRequestClient();
  const uploadData: Record<string, any> & { file: File | Blob } = {
    file,
    ...params,
  };

  const response: any = await requestClient.upload('/api/v1/system/common/init-upload-file', uploadData);

  // /init 页面尚未注入 saas 的 request client 时，getRequestClient() 返回的是 raw 模式的
  // AxiosResponse，真实数据在 response.data.data；注入后则直接返回 data 节点。
  // 这里统一解包，保证返回 UploadFileResp（含 filePath / fileUri）。
  return (response?.data?.data ?? response) as CoreApi.UploadFileResp;
}

/**
 * 上传文件到公开桶（永久可访问）
 * 用于富文本图片、封面图等需长期可访问的资源
 * @param file 文件
 * @param business 业务标识（必填，如 news, product 等）
 * @param scene 场景（可选，默认 file）
 * @param useBy 使用级别：user/tenant/platform（必填）
 */
export async function uploadPublicFile(
  file: File,
  options: {
    business: string;
    scene?: string;
    useBy: 'user' | 'tenant' | 'platform';
  },
) {
  const requestClient = getRequestClient();
  const uploadData: Record<string, any> & { file: File | Blob } = {
    file,
    isPublic: true,
    business: options.business,
    scene: options.scene || 'file',
    useBy: options.useBy,
  };

  const response = await requestClient.upload('/api/v1/system/common/upload-file', uploadData);

  return response;
}
