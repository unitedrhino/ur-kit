import type { RequestClient } from '../request-client';
import type { RequestClientConfig } from '../types';

import { isUndefined } from '@vben/utils';

class FileUploader {
  private client: RequestClient;

  constructor(client: RequestClient) {
    this.client = client;
  }

  public async upload<T = any>(url: string, data: Record<string, any> & { file: Blob | File }, config?: RequestClientConfig): Promise<T> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          !isUndefined(item) && formData.append(`${key}[${index}]`, item);
        });
      } else {
        !isUndefined(value) && formData.append(key, value);
      }
    });

    const finalConfig: RequestClientConfig = {
      ...config,
      timeout: config?.timeout ?? 900_000, // 文件上传默认超时 15 分钟
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    };

    return this.client.post(url, formData, finalConfig);
  }
}

export { FileUploader };
