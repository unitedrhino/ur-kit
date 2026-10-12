import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import { getEditorFetchHeaders } from '@/utils';
import { cloneDeep } from 'lodash-es';

import { emitProjectCoverUpdated } from './coverEvents';
import { BIGSCREEN_STANDALONE_IOT_APP_BASE, buildBigscreenRouteUrl } from './route-path';

type StorageInfo = {
  componentList: Array<CreateComponentGroupType | CreateComponentType>;
  editCanvasConfig: Record<string, any>;
  requestGlobalConfig: Record<string, any>;
};

/**
 * 封面截图流程专用的跨 iframe 预览数据通道。
 * 使用 window 全局 Map 替代 localStorage 传递大型 StorageInfo，
 * 避免 base64 图片等大数据超出 localStorage 配额（通常 5-10MB）。
 * iframe 内侧通过 window.parent.__COVER_PREVIEW_DATA__ 读取。
 */
declare global {
  interface Window {
    __COVER_PREVIEW_DATA__?: Map<string, Record<string, any>>;
  }
}

/** 获取或创建封面截图预览数据全局 Map */
function getCoverPreviewDataMap(): Map<string, Record<string, any>> {
  if (!window.__COVER_PREVIEW_DATA__) {
    window.__COVER_PREVIEW_DATA__ = new Map();
  }
  return window.__COVER_PREVIEW_DATA__;
}

type PendingJob = {
  payload: StorageInfo;
  seq: number;
};

type OffscreenRuntime = {
  iframe: HTMLIFrameElement;
  useCount: number;
  wrapper: HTMLDivElement;
};

const PREVIEW_TIMEOUT = 12_000;
const SAFETY_WAIT = 500;
const SAFETY_WAIT_LIGHT = 300;
const DEBOUNCE_MS = 800;
const MAX_REUSE_COUNT = 10;
const MAX_CAPTURE_ATTEMPTS = 3;
const RETRY_WAIT_MS = 900;
const DOM_STABLE_QUIET_MS = 800;
const DOM_STABLE_QUIET_MS_LIGHT = 400;
const DOM_STABLE_MAX_WAIT_MS = 3000;
const CANVAS_STABLE_QUIET_MS = 900;
const CANVAS_STABLE_MAX_WAIT_MS = 5000;
const PREVIEW_ASYNC_IDLE_MS = 800;
const PREVIEW_ASYNC_MAX_WAIT_MS = 2500;

const pendingJobs = new Map<string, PendingJob>();
const queuedProjectIds = new Set<string>();
const debounceTimers = new Map<string, number>();

let processing = false;
let offscreenRuntime: null | OffscreenRuntime = null;
let jobSeq = 0;
let html2canvasLoader: null | Promise<typeof import('html2canvas')> = null;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clonePayload(storageInfo: StorageInfo): StorageInfo {
  try {
    return structuredClone(storageInfo);
  } catch {
    return cloneDeep(storageInfo);
  }
}

async function loadHtml2Canvas() {
  if (!html2canvasLoader) {
    html2canvasLoader = import('html2canvas');
  }
  const module = await html2canvasLoader;
  return module.default;
}

function destroyOffscreenRuntime() {
  if (!offscreenRuntime) return;
  offscreenRuntime.wrapper.remove();
  offscreenRuntime = null;
}

function ensureOffscreenRuntime() {
  if (offscreenRuntime && offscreenRuntime.useCount < MAX_REUSE_COUNT) {
    return offscreenRuntime;
  }

  destroyOffscreenRuntime();

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '1920px';
  wrapper.style.height = '1080px';
  wrapper.style.opacity = '0';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.zIndex = '-1';
  wrapper.style.overflow = 'hidden';
  wrapper.setAttribute('aria-hidden', 'true');

  const iframe = document.createElement('iframe');
  iframe.src = 'about:blank';
  iframe.width = '1920';
  iframe.height = '1080';
  iframe.style.width = '1920px';
  iframe.style.height = '1080px';
  iframe.style.border = '0';
  iframe.style.background = '#0d0d0d';

  wrapper.append(iframe);
  document.body.append(wrapper);

  offscreenRuntime = {
    iframe,
    wrapper,
    useCount: 0,
  };
  return offscreenRuntime;
}

function waitForIframeLoad(iframe: HTMLIFrameElement) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('封面离屏预览加载超时'));
    }, PREVIEW_TIMEOUT);

    function cleanup() {
      window.clearTimeout(timer);
      iframe.removeEventListener('load', onLoad);
      iframe.removeEventListener('error', onError);
    }

    function onLoad() {
      cleanup();
      resolve();
    }

    function onError() {
      cleanup();
      reject(new Error('封面离屏预览加载失败'));
    }

    iframe.addEventListener('load', onLoad, { once: true });
    iframe.addEventListener('error', onError, { once: true });
  });
}

async function waitForImages(doc: Document) {
  const images = [...doc.images];
  const pending = images.filter((img) => !img.complete);
  if (pending.length === 0) return;

  await Promise.allSettled(
    pending.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
          window.setTimeout(resolve, 2000);
        }),
    ),
  );
}

async function waitForECharts(doc: Document) {
  const chartRoots = [...doc.querySelectorAll('[_echarts_instance_]')];
  if (chartRoots.length === 0) return;

  await Promise.race([
    Promise.allSettled(
      chartRoots.map(
        (root) =>
          new Promise<void>((resolve) => {
            const anyWindow = doc.defaultView as any;
            const echarts = anyWindow?.echarts;
            const instance = echarts?.getInstanceByDom?.(root as HTMLElement);
            if (!instance) {
              window.setTimeout(resolve, 300);
              return;
            }

            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              try {
                instance.off?.('finished', finish);
              } catch {
                // ignore
              }
              resolve();
            };

            try {
              instance.on?.('finished', finish);
            } catch {
              // ignore
            }

            window.setTimeout(finish, 1200);
          }),
      ),
    ),
    new Promise<void>((resolve) => window.setTimeout(resolve, 1600)),
  ]);
}

async function waitForDomStable(target: HTMLElement, doc: Document, quietMs = DOM_STABLE_QUIET_MS) {
  const win = doc.defaultView;
  if (!win || typeof win.MutationObserver !== 'function') {
    await new Promise((resolve) => window.setTimeout(resolve, quietMs));
    return;
  }

  await new Promise<void>((resolve) => {
    let done = false;
    let quietTimer = 0;
    let hardTimer = 0;

    const cleanup = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      win.clearTimeout(quietTimer);
      win.clearTimeout(hardTimer);
      resolve();
    };

    const armQuietTimer = () => {
      win.clearTimeout(quietTimer);
      quietTimer = win.setTimeout(cleanup, quietMs);
    };

    const observer = new win.MutationObserver(() => {
      armQuietTimer();
    });

    observer.observe(target, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    hardTimer = win.setTimeout(cleanup, DOM_STABLE_MAX_WAIT_MS);
    armQuietTimer();
  });

  await new Promise((resolve) => window.setTimeout(resolve, 250));
}

function getCanvasSignature(canvas: HTMLCanvasElement) {
  const width = canvas.width;
  const height = canvas.height;
  if (width < 1 || height < 1) {
    return { ready: false, signature: `${width}x${height}:0` };
  }

  try {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 6;
    sampleCanvas.height = 6;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) {
      return { ready: true, signature: `${width}x${height}:noctx` };
    }

    sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
    sampleCtx.drawImage(canvas, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const { data } = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
    let sum = 0;
    for (const datum of data) {
      sum += datum;
    }

    return {
      ready: sum > 0,
      signature: `${width}x${height}:${sum}`,
    };
  } catch {
    return {
      ready: true,
      signature: `${width}x${height}:tainted`,
    };
  }
}

async function waitForCanvasStable(target: HTMLElement) {
  const start = Date.now();
  let lastSignature = '';
  let stableSince = 0;

  while (Date.now() - start < CANVAS_STABLE_MAX_WAIT_MS) {
    const canvases = [...target.querySelectorAll('canvas')].filter((node) => {
      const canvas = node as HTMLCanvasElement;
      return canvas.getBoundingClientRect().width > 0 && canvas.getBoundingClientRect().height > 0;
    }) as HTMLCanvasElement[];

    if (canvases.length === 0) return;

    const results = canvases.map((canvas) => getCanvasSignature(canvas));
    const signature = results.map((item) => item.signature).join('|');
    const allReady = results.every((item) => item.ready);

    if (signature !== lastSignature) {
      lastSignature = signature;
      stableSince = Date.now();
    }

    if (allReady && stableSince > 0 && Date.now() - stableSince >= CANVAS_STABLE_QUIET_MS) {
      return;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
}

async function waitForPreviewAsyncIdle(doc: Document) {
  const start = Date.now();
  while (Date.now() - start < PREVIEW_ASYNC_MAX_WAIT_MS) {
    const runtime = (doc.defaultView as any)?.__BIGSCREEN_PREVIEW_RUNTIME__;
    if (!runtime) return;

    const pending = Number(runtime.pendingAsyncTasks ?? 0);
    const lastSettledAt = Number(runtime.lastSettledAt ?? 0);
    if (pending === 0 && lastSettledAt > 0 && Date.now() - lastSettledAt >= PREVIEW_ASYNC_IDLE_MS) {
      return;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
}

/** 检测是否为轻量画布（无 ECharts 图表/地图/复杂组件），轻量画布使用更短的等待参数 */
function isLightweightCanvas(storageInfo: StorageInfo): boolean {
  const heavyChartKeys = new Set(['VBarChart', 'VLineChart', 'VPieChart', 'VScatterChart', 'VRadarChart', 'VFunnelChart', 'VHeatmapChart', 'VMapBase', 'VCapsuleChart', 'VTreeMapChart', 'VSankeyChart', 'VWaterPoloChart', 'VGraphChart', 'VBorderDualChart']);
  const componentList = storageInfo.componentList || [];
  if (componentList.length === 0) return true;

  for (const comp of componentList) {
    const chartKey = (comp as any)?.chartConfig?.chartKey || (comp as any)?.chartConfig?.key || '';
    if (heavyChartKeys.has(chartKey)) return false;
    if ((comp as any)?.isGroup && Array.isArray((comp as any)?.groupList)) {
      for (const sub of (comp as any).groupList) {
        const subKey = sub?.chartConfig?.chartKey || sub?.chartConfig?.key || '';
        if (heavyChartKeys.has(subKey)) return false;
      }
    }
  }
  return true;
}

async function waitForPreviewReady(doc: Document, storageInfo: StorageInfo) {
  const light = isLightweightCanvas(storageInfo);
  const stableMs = light ? DOM_STABLE_QUIET_MS_LIGHT : DOM_STABLE_QUIET_MS;
  const safetyMs = light ? SAFETY_WAIT_LIGHT : SAFETY_WAIT;

  const start = Date.now();
  while (Date.now() - start < PREVIEW_TIMEOUT) {
    const target = doc.querySelector('.go-preview-scale > div') as HTMLElement | null;
    if (target && target.getBoundingClientRect().width > 0 && target.getBoundingClientRect().height > 0) {
      await waitForImages(doc);
      await waitForECharts(doc);
      await waitForPreviewAsyncIdle(doc);
      await waitForDomStable(target, doc, stableMs);
      await waitForCanvasStable(target);
      await new Promise((resolve) => window.setTimeout(resolve, safetyMs));
      return target;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }
  throw new Error('封面离屏渲染超时');
}

async function uploadCoverBlob(projectId: string, blob: Blob) {
  const form = new FormData();
  form.append('file', blob, `thumb_${projectId}_${Date.now()}.jpg`);
  form.append('isPublic', 'true');
  form.append('business', 'view');
  form.append('scene', 'goView/projectIndexImage');
  form.append('useBy', 'user');
  const uploadRes = await fetch('/api/v1/system/common/upload-file', {
    method: 'POST',
    headers: getEditorFetchHeaders(),
    body: form,
  });
  const uploadData = await uploadRes.json();
  const filePath = (uploadData?.data?.fileUri || uploadData?.fileUri || uploadData?.data?.filePath || uploadData?.filePath || '').trim();
  if (!filePath) {
    throw new Error('封面上传成功但未返回可用路径');
  }
  return filePath;
}

async function updateProjectCover(projectId: string, filePath: string) {
  const updateRes = await fetch('/api/v1/view/project/update', {
    method: 'POST',
    headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: projectId, indexImage: filePath }),
  });
  const updateData = await updateRes.json();
  if (updateData.code && updateData.code !== 200) {
    throw new Error(updateData.msg || '封面回写失败');
  }
}

function normalizeStorageUrls(obj: any): any {
  if (typeof obj === 'string') {
    try {
      if (/^https?:\/\//.test(obj)) {
        const u = new URL(obj);
        if (u.pathname.startsWith('/oss/')) {
          return u.pathname + u.search + u.hash;
        }
        return obj;
      }
    } catch { /* ignore */ }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(normalizeStorageUrls);
  if (obj && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) result[key] = normalizeStorageUrls(obj[key]);
    return result;
  }
  return obj;
}

export async function captureProjectCoverAsset(projectId: string, storageInfo: StorageInfo) {
  const normalized = normalizeStorageUrls(cloneDeep(storageInfo));
  const previewData = { ...normalized, _previewTimestamp: Date.now() };

  // 优先使用 window 全局 Map 传递预览数据（无容量限制，内存直传），
  // 同时尝试写入 localStorage 作为兜底（供非同源 iframe 或新标签页预览使用）。
  const previewDataMap = getCoverPreviewDataMap();
  previewDataMap.set(projectId, previewData);

  const previewStorageKey = `GO_PREVIEW_DATA_${projectId}`;
  try {
    localStorage.setItem(previewStorageKey, JSON.stringify(previewData));
  } catch {
    // localStorage 配额不足时静默忽略，全局 Map 已保证数据可达
  }

  const runtime = ensureOffscreenRuntime();
  runtime.useCount += 1;

  try {
    const previewUrl = buildBigscreenRouteUrl(
      '/',
      `/preview/${encodeURIComponent(projectId)}`,
      {
        coverMode: '1',
        coverTask: Date.now(),
      },
      { appBase: BIGSCREEN_STANDALONE_IOT_APP_BASE },
    );
    runtime.iframe.src = previewUrl;
    await waitForIframeLoad(runtime.iframe);
    const doc = runtime.iframe.contentDocument;
    if (!doc) throw new Error('离屏预览文档不可访问');

    const target = await waitForPreviewReady(doc, storageInfo);
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(target, {
      backgroundColor: '#0d0d0d',
      allowTaint: false,
      useCORS: true,
      scale: 0.6,
      logging: false,
      imageTimeout: 3000,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.78),
    );
    if (!blob) {
      throw new Error('封面截图导出失败');
    }

    const filePath = await uploadCoverBlob(projectId, blob);
    return filePath;
  } finally {
    previewDataMap.delete(projectId);
    localStorage.removeItem(previewStorageKey);
  }
}

async function _runCapture(projectId: string, storageInfo: StorageInfo) {
  try {
    const filePath = await captureProjectCoverAsset(projectId, storageInfo);
    await updateProjectCover(projectId, filePath);
    emitProjectCoverUpdated({
      filePath,
      projectId,
      updatedAt: Date.now(),
    });
    return { success: true as const };
  } catch (error) {
    console.warn('[scheduleProjectCover] 封面生成失败:', error);
    try {
      window.$message?.warning?.(`封面生成失败：${error instanceof Error ? error.message : '未知错误'}`);
    } catch {
      // ignore message failures
    }
    return {
      success: false as const,
      error: error instanceof Error ? error.message : '封面生成失败',
    };
  }
}

async function runCaptureWithRetry(projectId: string, storageInfo: StorageInfo) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_CAPTURE_ATTEMPTS; attempt += 1) {
    try {
      const filePath = await captureProjectCoverAsset(projectId, storageInfo);
      await updateProjectCover(projectId, filePath);
      emitProjectCoverUpdated({
        filePath,
        projectId,
        updatedAt: Date.now(),
      });
      return { success: true as const };
    } catch (error) {
      lastError = error;
    }

    destroyOffscreenRuntime();
    console.warn(`[scheduleProjectCover] project ${projectId} retry ${attempt}/${MAX_CAPTURE_ATTEMPTS} failed:`, lastError);
    if (attempt < MAX_CAPTURE_ATTEMPTS) {
      await sleep(RETRY_WAIT_MS);
    }
  }

  try {
    const errorMessage = lastError instanceof Error ? lastError.message : '未知错误';
    window.$message?.warning?.(`封面生成失败：${errorMessage}`);
  } catch {
    // ignore message failures
  }

  return {
    success: false as const,
    error: lastError instanceof Error ? lastError.message : '封面生成失败',
  };
}

async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    while (queuedProjectIds.size > 0) {
      const projectId = queuedProjectIds.values().next().value as string;
      queuedProjectIds.delete(projectId);

      const currentJob = pendingJobs.get(projectId);
      if (!currentJob) continue;

      const startSeq = currentJob.seq;
      const result = await runCaptureWithRetry(projectId, currentJob.payload);

      const latestJob = pendingJobs.get(projectId);
      if (latestJob && latestJob.seq !== startSeq) {
        queuedProjectIds.add(projectId);
        continue;
      }

      pendingJobs.delete(projectId);
      if (!result.success) {
        console.warn(`[scheduleProjectCover] project ${projectId} failed:`, result.error);
      }
    }
  } finally {
    processing = false;
  }
}

/**
 * 调度封面截取任务。
 *
 * @param projectId  大屏项目 ID
 * @param storageInfo  画布存储信息
 * @param opts.skipDebounce  跳过防抖立即执行，并返回 Promise 等待完成
 */
export function scheduleProjectCover(
  projectId: string,
  storageInfo: StorageInfo,
  opts?: { skipDebounce?: boolean },
): Promise<void> | void {
  const seq = ++jobSeq;
  pendingJobs.set(projectId, {
    payload: clonePayload(storageInfo),
    seq,
  });

  const prevTimer = debounceTimers.get(projectId);
  if (prevTimer) {
    window.clearTimeout(prevTimer);
  }

  if (opts?.skipDebounce) {
    debounceTimers.delete(projectId);
    queuedProjectIds.add(projectId);
    return processQueue();
  }

  const timer = window.setTimeout(() => {
    debounceTimers.delete(projectId);
    queuedProjectIds.add(projectId);
    void processQueue();
  }, DEBOUNCE_MS);

  debounceTimers.set(projectId, timer);
}

/** 检查是否有待处理的封面任务，用于 beforeunload 判断 */
export function hasPendingCoverJobs(): boolean {
  return processing || queuedProjectIds.size > 0 || debounceTimers.size > 0 || pendingJobs.size > 0;
}

/** 立即刷新所有待处理的封面任务，用于 beforeunload 最后拦截 */
export function flushAllPendingCoverJobs(): Promise<void> {
  for (const [projectId, timer] of debounceTimers) {
    window.clearTimeout(timer);
    queuedProjectIds.add(projectId);
  }
  debounceTimers.clear();
  return processQueue();
}
