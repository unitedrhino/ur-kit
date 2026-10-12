import { captureComponentSnapshot } from '@/packages/custom/captureSnapshot';
import { getEditorFetchHeaders } from '@/utils';
import { cloneDeep } from 'lodash-es';

import { emitComponentCoverUpdated } from './coverEvents';

type ChartEditStoragePayload = {
  componentList: Array<any>;
  editCanvasConfig: Record<string, any>;
  requestGlobalConfig: Record<string, any>;
};

type PendingJob = {
  captureComponentId: string;
  componentData?: any;
  currentPath: string;
  seq: number;
  snapshotDataUrl?: string;
  storageInfo: ChartEditStoragePayload;
  templateContent?: Record<string, any>;
};

const DEBOUNCE_MS = 800;

const pendingJobs = new Map<string, PendingJob>();
const queuedComponentIds = new Set<string>();
const debounceTimers = new Map<string, number>();

let processing = false;
let jobSeq = 0;

function cloneTemplateContent(templateContent?: Record<string, any>) {
  if (!templateContent) return undefined;
  try {
    return structuredClone(templateContent);
  } catch {
    return cloneDeep(templateContent);
  }
}

async function uploadComponentCoverBlob(componentId: string, snapshot: string) {
  const blob = await fetch(snapshot).then((response) => response.blob());
  const form = new FormData();
  form.append('file', blob, `comp_${componentId}_${Date.now()}.jpg`);

  const uploadRes = await fetch('/api/v1/system/common/upload-file', {
    method: 'POST',
    headers: getEditorFetchHeaders(),
    body: form,
  });
  const uploadData = await uploadRes.json();
  const filePath = (uploadData?.data?.fileUri || uploadData?.fileUri || uploadData?.data?.filePath || uploadData?.filePath || '').trim();
  if (!filePath) {
    throw new Error('组件封面上传成功但未返回可用路径');
  }
  return filePath;
}

async function updateComponentCover(componentId: string, filePath: string, templateContent?: Record<string, any>) {
  if (templateContent) {
    const payload = {
      id: componentId,
      content: JSON.stringify({
        ...templateContent,
        thumbnail: templateContent.thumbnail || '',
      }),
      cover: filePath,
    };
    const res = await fetch('/api/v1/view/component/design', {
      method: 'POST',
      headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || (data.code && data.code !== 200)) {
      throw new Error(data.msg || data.message || '组件封面回写失败');
    }
    return;
  }

  const res = await fetch('/api/v1/view/component/update', {
    method: 'POST',
    headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: componentId, cover: filePath }),
  });
  const data = await res.json();
  if (!res.ok || (data.code && data.code !== 200)) {
    throw new Error(data.msg || data.message || '组件封面回写失败');
  }
}

async function runCapture(componentId: string, job: PendingJob) {
  const snapshot =
    job.snapshotDataUrl ||
    (await captureComponentSnapshot(job.captureComponentId, {
      componentData: job.componentData,
      currentPath: job.currentPath,
      storageInfo: job.storageInfo,
    }));
  if (!snapshot) {
    throw new Error('组件封面截图失败');
  }

  const templateContent = cloneTemplateContent(job.templateContent);
  if (templateContent) {
    templateContent.thumbnail = snapshot;
  }

  const filePath = await uploadComponentCoverBlob(componentId, snapshot);
  await updateComponentCover(componentId, filePath, templateContent);
  emitComponentCoverUpdated({
    componentId,
    updatedAt: Date.now(),
  });
  window.dispatchEvent(new CustomEvent('custom-component-changed'));
}

async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    while (queuedComponentIds.size > 0) {
      const componentId = queuedComponentIds.values().next().value as string;
      queuedComponentIds.delete(componentId);

      const currentJob = pendingJobs.get(componentId);
      if (!currentJob) continue;

      const startSeq = currentJob.seq;

      try {
        await runCapture(componentId, currentJob);
      } catch (error) {
        console.warn('[scheduleComponentCover] 组件封面生成失败:', componentId, error);
      }

      const latestJob = pendingJobs.get(componentId);
      if (latestJob && latestJob.seq !== startSeq) {
        queuedComponentIds.add(componentId);
        continue;
      }

      pendingJobs.delete(componentId);
    }
  } finally {
    processing = false;
  }
}

export function scheduleComponentCover(
  componentId: string,
  options: {
    captureComponentId: string;
    componentData?: any;
    currentPath: string;
    snapshotDataUrl?: string;
    storageInfo: ChartEditStoragePayload;
    templateContent?: Record<string, any>;
  },
) {
  if (!componentId) return;

  pendingJobs.set(componentId, {
    ...options,
    seq: ++jobSeq,
  });

  const prevTimer = debounceTimers.get(componentId);
  if (prevTimer) {
    window.clearTimeout(prevTimer);
  }

  const timer = window.setTimeout(() => {
    debounceTimers.delete(componentId);
    queuedComponentIds.add(componentId);
    void processQueue();
  }, DEBOUNCE_MS);

  debounceTimers.set(componentId, timer);
}
