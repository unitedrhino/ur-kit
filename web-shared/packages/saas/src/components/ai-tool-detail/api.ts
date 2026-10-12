/**
 * 文件说明：AI 工具相关 API 封装（供 AiToolDetail 组件使用）。
 * 从 org-manage 应用 ai-center/tool/index.api.ts 下沉为共享封装，基于 @vben/api 的 requestClient，
 * 不带任何单一应用的业务耦合。
 */
import { requestClient } from '@vben/api';

/** 将 ID 规范为 JSON 数字；WithID 类接口（delete/publish/disable）不接受字符串 */
function toJsonInt64(id: number | string): number {
  const n = typeof id === 'number' ? id : Number(id);
  if (!Number.isFinite(n)) {
    throw new Error('无效的工具 ID');
  }
  return n;
}

/** ToolInfo 工具元信息（对应后端 ai/tool get-one/get-list 返回的 info）。 */
export interface ToolInfo {
  id?: number | string;
  tenantCode?: string;
  agentGroupID?: number;
  cloneGroupID?: number;
  groupName?: string;
  code?: string;
  name?: string;
  description?: string;
  status?: number | string;
  version?: number;
  createdTime?: string;
}

/** ToolArtifactFile 工具详情可按需读取的三件套文件名。 */
export type ToolArtifactFile = 'executor.js' | 'manifest.json' | 'skill.md';

/** aiToolApi AI 工具接口集合：详情/发布/停用/运行/导入导出。 */
export const aiToolApi = {
  async getOne(id: number | string, artifactFiles?: ToolArtifactFile[]) {
    return requestClient.post<{
      info: ToolInfo;
      artifact: { executorJs: string; documentMd: string; manifestJson: string };
    }>('/api/v1/ai/tool/get-one', {
      id: toJsonInt64(id),
      ...(artifactFiles?.length ? { artifactFiles } : {}),
    });
  },

  async publish(id: number | string) {
    return requestClient.post('/api/v1/ai/tool/publish', { id: toJsonInt64(id) });
  },

  async disable(id: number | string) {
    return requestClient.post('/api/v1/ai/tool/disable', { id: toJsonInt64(id) });
  },

  async remove(id: number | string) {
    return requestClient.post('/api/v1/ai/tool/delete', { id: toJsonInt64(id) });
  },

  async run(toolID: number | string, inputs: string) {
    return requestClient.post<{ runID: string }>('/api/v1/ai/tool/run', {
      toolID: toJsonInt64(toolID),
      inputs,
    });
  },

  async runStatus(runID: string) {
    return requestClient.post<{
      runID: string;
      status: string;
      state: string;
      output: string;
      logs: string;
      durationMs: number;
      errorMsg: string;
    }>('/api/v1/ai/tool/run-status', { runID });
  },

  async importZip(zipFile: File, id: number | string) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve((reader.result as string).split(',')[1] ?? '');
      reader.readAsDataURL(zipFile);
    });
    return requestClient.post<{ id: number }>('/api/v1/ai/tool/import', {
      id: toJsonInt64(id),
      zipData: base64,
    });
  },

  async exportZip(id: number | string) {
    return requestClient.post<{ zipData: string; fileName: string }>(
      '/api/v1/ai/tool/export',
      { id: toJsonInt64(id) },
    );
  },
};
