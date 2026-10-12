/**
 * useSceneAi —— SceneEditor 的 AI 对话 composable。
 *
 * 职责：
 * 1. 维护对话消息数组
 * 2. 调用 `${VITE_AI_API_BASE}/api/chat`（SSE），把文本增量与 ScenePatch 分别累积
 * 3. 暴露 pendingPatch 给 UI 预览；用户确认后由外部调用 applyScenePatch
 *
 * P1 阶段：mock server 直接返回固定 patch；P2 接入真实 LLM。
 */
import { $t } from '@vben/locales';

import { computed, ref } from 'vue';
import { useSessionStore } from '../../../../store/session';
import type { SceneDraft } from '../types';
import type { SceneDraftContext } from '../composables/useSceneDraft';
import { applyScenePatch } from './applyPatch';
import type { AiChatMessage, AiStreamEvent, ScenePatch } from './patch-types';

const API_BASE =
  (import.meta.env.VITE_AI_API_BASE as string) ||
  'https://aiservice.ykhl.vip';

/**
 * 组装鉴权 header（与 saas 主请求拦截器一致：token / tenant-code / app-id）
 * ai-server 收到后会透传给 saas 后端做 tool-use 查询
 */
function buildAuthHeaders(): Record<string, string> {
  const sessionStore = useSessionStore();
  const appId = (import.meta.env.VITE_GLOB_APPID as string) || '';
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (sessionStore.token) h['token'] = sessionStore.token;
  if (sessionStore.tenantCode) h['tenant-code'] = sessionStore.tenantCode;
  if (appId) h['app-id'] = appId;
  return h;
}

/**
 * 把后端/网络原始错误转成友好的中文文案。
 * 返回 { title, detail, retryable } — detail 是原始信息，供展开查看。
 */
function friendlyError(raw: unknown): {
  title: string;
  detail: string;
  retryable: boolean;
} {
  const msg = raw instanceof Error ? raw.message : String(raw || '');
  const low = msg.toLowerCase();
  if (!msg) {
    return { title: $t('scene.ui.anErrorOccurred'), detail: '', retryable: true };
  }
  if (/abort|aborted/i.test(msg)) {
    return { title: $t('scene.ui.requestCanceled'), detail: msg, retryable: true };
  }
  if (
    low.includes('failed to fetch') ||
    low.includes('network') ||
    low.includes('econnrefused') ||
    low.includes('timeout') ||
    low.includes('etimedout')
  ) {
    return {
      title: $t('scene.ui.networkAbnormalityPleaseCheckTheNetworkAndTryAgain'),
      detail: msg,
      retryable: true,
    };
  }
  const mHttp = /HTTP\s+(\d+)/i.exec(msg);
  if (mHttp) {
    const code = Number(mHttp[1]);
    if (code === 401 || code === 403) {
      return {
        title: $t('scene.ui.loginHasExpiredPleaseRefreshThePageAndTryAgain'),
        detail: msg,
        retryable: false,
      };
    }
    if (code === 429) {
      return {
        title: $t('scene.ui.aiServiceIsBusyPleaseTryAgainLater'),
        detail: msg,
        retryable: true,
      };
    }
    if (code >= 500) {
      return {
        title: $t('scene.ui.aiServiceIsTemporarilyUnavailableTryAgainLater'),
        detail: msg,
        retryable: true,
      };
    }
    return { title: $t('scene.ui.requestFailedHttpCode', { code }), detail: msg, retryable: true };
  }
  if (/ScenePatch\s*校验失败/.test(msg) || /validation/i.test(msg)) {
    return {
      title: $t('scene.ui.theStructureReturnedByAiIsIncompleteYouCanClickRetry'),
      detail: msg,
      retryable: true,
    };
  }
  return { title: $t('scene.ui.anErrorOccurred'), detail: msg, retryable: true };
}

export function useSceneAi() {
  const messages = ref<AiChatMessage[]>([]);
  const streaming = ref(false);
  const error = ref<{
    title: string;
    detail: string;
    retryable: boolean;
  } | null>(null);
  /** 最近一次 AI 产出、尚未 apply 的 patch */
  const pendingPatch = ref<ScenePatch | null>(null);
  /** 最近一次 apply 前的 draft 快照，用于撤销 */
  const lastSnapshot = ref<SceneDraft | null>(null);
  /** 最近一次成功 apply 的 patch（用于"重新生成"时保留上下文） */
  const lastAppliedPatch = ref<ScenePatch | null>(null);

  const hasPending = computed(
    () =>
      pendingPatch.value !== null &&
      (pendingPatch.value.triggers?.length ||
        pendingPatch.value.actions?.length ||
        pendingPatch.value.conditions?.length ||
        pendingPatch.value.validRanges?.length ||
        pendingPatch.value.invalidRanges?.length ||
        pendingPatch.value.name !== undefined ||
        pendingPatch.value.desc !== undefined),
  );

  function clearPending() {
    pendingPatch.value = null;
  }

  function clearAll() {
    messages.value = [];
    pendingPatch.value = null;
    lastSnapshot.value = null;
    lastAppliedPatch.value = null;
    error.value = null;
  }

  function clearError() {
    error.value = null;
  }

  /** 把 pendingPatch 应用到 ctx，并记录撤销点 */
  function apply(ctx: SceneDraftContext) {
    const patch = pendingPatch.value;
    if (!patch) return;
    // 深拷贝 draft 作快照（draft 是 reactive，JSON 往返即可得纯对象）
    lastSnapshot.value = JSON.parse(JSON.stringify(ctx.draft));
    applyScenePatch(ctx, patch);
    lastAppliedPatch.value = patch;
    pendingPatch.value = null;
  }

  /** 撤销最近一次 apply */
  function undo(ctx: SceneDraftContext) {
    if (!lastSnapshot.value) return;
    ctx.reset(lastSnapshot.value);
    lastSnapshot.value = null;
    lastAppliedPatch.value = null;
  }

  const canUndo = computed(() => lastSnapshot.value !== null);

  /**
   * 重新生成：找到最后一条 user 消息，弹掉它之后的所有消息，再次 send 同一内容
   */
  async function retryLast(
    ctx: SceneDraftContext,
    extra?: { sceneType?: 'auto' | 'manual' },
  ) {
    if (streaming.value) return;
    // 从尾向前找最后一条 user
    let lastUserIdx = -1;
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i]!.role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;
    const lastUser = messages.value[lastUserIdx]!;
    // 删掉 lastUser 及其之后（随后 send 会再 push 一次）
    messages.value.splice(lastUserIdx);
    pendingPatch.value = null;
    await send(lastUser.content, { draft: ctx.draft, sceneType: extra?.sceneType });
  }

  /**
   * 发送一条用户消息。会把流式文本追加到新的 assistant 消息，并把 patch 放入 pendingPatch。
   */
  async function send(
    userText: string,
    extra?: { draft?: unknown; sceneType?: 'auto' | 'manual' },
  ) {
    const text = userText.trim();
    if (!text || streaming.value) return;

    error.value = null;
    messages.value.push({ role: 'user', content: text });
    const assistantIdx = messages.value.push({
      role: 'assistant',
      content: '',
    }) - 1;

    streaming.value = true;
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          messages: messages.value.slice(0, -1), // 不含刚占位的 assistant
          draft: extra?.draft,
          sceneType: extra?.sceneType,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error($t('scene.ui.aiServiceExceptionHttpCode', { code: res.status }));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // 解析 SSE：data: {...}\n\n
        let idx;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const evt = JSON.parse(payload) as AiStreamEvent;
              handleEvent(evt, assistantIdx);
            } catch {
              // 容错：丢弃不合法 chunk
            }
          }
        }
      }
    } catch (e) {
      const fe = friendlyError(e);
      error.value = fe;
      messages.value[assistantIdx]!.content ||= `（${fe.title}）`;
    } finally {
      streaming.value = false;
    }
  }

  function handleEvent(evt: AiStreamEvent, assistantIdx: number) {
    const msg = messages.value[assistantIdx];
    switch (evt.type) {
      case 'text': {
        if (msg) msg.content += evt.delta;
        break;
      }
      case 'patch': {
        pendingPatch.value = evt.patch;
        break;
      }
      case 'tool': {
        if (!msg) break;
        if (!msg.toolCalls) msg.toolCalls = [];
        if (evt.phase === 'start') {
          msg.toolCalls.push({
            name: evt.name,
            status: 'running',
            input: evt.input,
          });
        } else {
          // 找最近一条同名且仍在 running 的记录
          const i = [...msg.toolCalls]
            .reverse()
            .findIndex((c) => c.name === evt.name && c.status === 'running');
          if (i !== -1) {
            const realIdx = msg.toolCalls.length - 1 - i;
            msg.toolCalls[realIdx] = {
              ...msg.toolCalls[realIdx]!,
              status: 'done',
              output: evt.output,
            };
          } else {
            msg.toolCalls.push({
              name: evt.name,
              status: 'done',
              output: evt.output,
            });
          }
        }
        break;
      }
      case 'error': {
        error.value = friendlyError(new Error(evt.message));
        break;
      }
      case 'done':
      default:
        break;
    }
  }

  return {
    messages,
    streaming,
    error,
    pendingPatch,
    hasPending,
    canUndo,
    send,
    apply,
    undo,
    retryLast,
    clearPending,
    clearError,
    clearAll,
  };
}
