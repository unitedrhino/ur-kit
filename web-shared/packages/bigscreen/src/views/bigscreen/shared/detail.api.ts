import { getRequestClient } from '@vben/api';

const BASE_URL = '/api/v1/view/project/detail';

export const ProjectDetailApi = {
  /** 获取项目配置内容 */
  async getContent(id: string): Promise<{ id: string; content: string }> {
    const requestClient = getRequestClient();
    return await requestClient.post<{ id: string; content: string }>(
      `${BASE_URL}/get-one`,
      { id: String(id) },
    );
  },

  /** 更新项目配置内容 */
  async updateContent(id: string, content: string): Promise<void> {
    const requestClient = getRequestClient();
    await requestClient.post(`${BASE_URL}/update`, {
      id: String(id),
      content,
    });
  },
};
