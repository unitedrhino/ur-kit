export type PreviewRuntimeState = {
  initializedAt: number;
  lastSettledAt: number;
  pendingAsyncTasks: number;
};

type PreviewWindow = Window & {
  __BIGSCREEN_PREVIEW_RUNTIME__?: PreviewRuntimeState;
  __BIGSCREEN_PREVIEW_RUNTIME_FETCH_PATCHED__?: boolean;
  __BIGSCREEN_PREVIEW_RUNTIME_XHR_PATCHED__?: boolean;
  // Window 接口本身不含 XMLHttpRequest（它是 globalThis 上的全局变量），as PreviewWindow 会丢失该成员，需显式声明
  XMLHttpRequest: typeof XMLHttpRequest;
};

function getPreviewWindow() {
  return window as PreviewWindow;
}

export function ensurePreviewRuntimeState() {
  const previewWindow = getPreviewWindow();
  if (!previewWindow.__BIGSCREEN_PREVIEW_RUNTIME__) {
    const now = Date.now();
    previewWindow.__BIGSCREEN_PREVIEW_RUNTIME__ = {
      initializedAt: now,
      lastSettledAt: now,
      pendingAsyncTasks: 0,
    };
  }
  return previewWindow.__BIGSCREEN_PREVIEW_RUNTIME__;
}

export function beginPreviewAsyncTask() {
  const runtime = ensurePreviewRuntimeState();
  runtime.pendingAsyncTasks += 1;

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    runtime.pendingAsyncTasks = Math.max(runtime.pendingAsyncTasks - 1, 0);
    runtime.lastSettledAt = Date.now();
  };
}

export function markPreviewRuntimeSettled() {
  const runtime = ensurePreviewRuntimeState();
  runtime.lastSettledAt = Date.now();
}

export function installPreviewAsyncTracker() {
  const previewWindow = getPreviewWindow();

  if (!previewWindow.__BIGSCREEN_PREVIEW_RUNTIME_FETCH_PATCHED__ && typeof previewWindow.fetch === 'function') {
    const rawFetch = previewWindow.fetch.bind(previewWindow);
    previewWindow.fetch = (async (...args: Parameters<typeof fetch>) => {
      const finish = beginPreviewAsyncTask();
      try {
        return await rawFetch(...args);
      } finally {
        finish();
      }
    }) as typeof previewWindow.fetch;
    previewWindow.__BIGSCREEN_PREVIEW_RUNTIME_FETCH_PATCHED__ = true;
  }

  if (!previewWindow.__BIGSCREEN_PREVIEW_RUNTIME_XHR_PATCHED__ && previewWindow.XMLHttpRequest) {
    const RawXHR = previewWindow.XMLHttpRequest;
    const rawSend = RawXHR.prototype.send;

    RawXHR.prototype.send = function (...args: any[]) {
      const finish = beginPreviewAsyncTask();
      const finalize = () => {
        this.removeEventListener('loadend', finalize);
        finish();
      };
      this.addEventListener('loadend', finalize, { once: true });
      return rawSend.apply(this, args as [any]);
    };

    previewWindow.__BIGSCREEN_PREVIEW_RUNTIME_XHR_PATCHED__ = true;
  }
}
