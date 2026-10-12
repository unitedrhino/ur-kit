/**
 * 文件说明：ai-chat 等待状态机，控制"等待首个回复内容"的加载态呈现节奏。
 *
 * 设计参考 WeKnora rag-pipeline-state 的控制器模式并按本仓消息结构简化：
 * - 250ms 内出内容不闪现加载态，避免快速回复出现闪烁占位；
 * - 已显示加载态后持续 60s 无内容，升级为"响应较慢"提示；
 * - 内容到达或生成结束立即收敛，保证任何路径下都不会永久"正在生成"。
 * 定时器通过 scheduler 注入，便于单测用假时钟驱动。
 */

/** 快速回复不闪现加载态的观察窗口。 */
export const AI_WAIT_REVEAL_DELAY_MS = 250;

/** 加载态已显示后，无内容等待多久升级为"响应较慢"。 */
export const AI_WAIT_STALL_DELAY_MS = 60_000;

export interface ChatWaitInput {
  /** 是否已输出任何正文内容。 */
  hasContent: boolean;
  /** 本条消息是否仍在生成。 */
  isLoading: boolean;
}

export interface ChatWaitView {
  /** 是否超过等待上限，需要显示"响应较慢"。 */
  stalled: boolean;
  /** 是否显示等待加载行。 */
  visible: boolean;
}

export interface ChatWaitScheduler {
  clearTimeout: (handle: unknown) => void;
  setTimeout: (callback: () => void, ms: number) => unknown;
}

const defaultScheduler: ChatWaitScheduler = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface ChatWaitController {
  /** 清理全部定时器，组件卸载时调用。 */
  dispose: () => void;
  /** 按最新消息状态推进状态机，视图变化时触发 onChange。 */
  update: (input: ChatWaitInput) => void;
}

/**
 * createChatWaitController 把消息等待状态转换为渲染视图：
 * 观察期内到达内容不闪现加载态；加载态显示后重挂 60s 上限；
 * 内容到达或生成结束立即归零；视图未变化时不重复回调。
 */
export function createChatWaitController(onChange: (view: ChatWaitView) => void, scheduler: ChatWaitScheduler = defaultScheduler): ChatWaitController {
  let view: ChatWaitView = { visible: false, stalled: false };
  let revealHandle: unknown;
  let stallHandle: unknown;

  const cancelTimers = () => {
    if (revealHandle !== undefined) {
      scheduler.clearTimeout(revealHandle);
      revealHandle = undefined;
    }
    if (stallHandle !== undefined) {
      scheduler.clearTimeout(stallHandle);
      stallHandle = undefined;
    }
  };

  const emit = (next: ChatWaitView) => {
    if (next.visible === view.visible && next.stalled === view.stalled) return;
    view = next;
    onChange(view);
  };

  /** stall 只负责把已显示的等待行升级为"响应较慢"，不负责隐藏。 */
  const armStall = () => {
    stallHandle = scheduler.setTimeout(() => {
      stallHandle = undefined;
      emit({ visible: true, stalled: true });
    }, AI_WAIT_STALL_DELAY_MS);
  };

  return {
    update(input) {
      cancelTimers();
      if (!input.isLoading || input.hasContent) {
        emit({ visible: false, stalled: false });
        return;
      }
      if (view.visible) {
        armStall();
        return;
      }
      revealHandle = scheduler.setTimeout(() => {
        revealHandle = undefined;
        emit({ visible: true, stalled: false });
        armStall();
      }, AI_WAIT_REVEAL_DELAY_MS);
    },
    dispose() {
      cancelTimers();
    },
  };
}
