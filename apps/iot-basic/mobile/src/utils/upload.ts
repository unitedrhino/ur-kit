import { config } from '../config';
import { getRequestContext } from './request-context';

interface UploadResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface UploadFileResult {
  filePath: string;
  fileUri: string;
}

function parseUploadResponse(value: unknown): UploadResponse<UploadFileResult> | null {
  if (!value) return null;
  const raw = typeof value === 'string' ? JSON.parse(value) : value;
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  if (typeof payload.code !== 'number') return null;
  return payload as unknown as UploadResponse<UploadFileResult>;
}

/** uploadFile 上传用户主动选择的本地文件，并复用业务请求头上下文。 */
export function uploadFile(filePath: string): Promise<UploadFileResult> {
  const token = uni.getStorageSync('token') || '';
  const header: Record<string, string> = {
    'app-id': config.appId,
  };
  if (token) header.token = token;
  const { tenantCode, projectID } = getRequestContext();
  if (tenantCode) header['ithings-tenant-code'] = tenantCode;
  if (projectID) header['ithings-project-id'] = projectID;

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${config.apiBaseUrl}/api/v1/system/common/upload-file`,
      filePath,
      name: 'file',
      header,
      success(res) {
        try {
          const resp = parseUploadResponse(res.data);
          if (!resp) {
            reject(new Error('上传响应格式错误'));
            return;
          }
          if (resp.code !== 200) {
            reject(new Error(resp.msg || '上传失败'));
            return;
          }
          resolve(resp.data);
        } catch (error) {
          reject(error);
        }
      },
      fail(error) {
        reject(new Error(error.errMsg || '上传失败'));
      },
    });
  });
}
