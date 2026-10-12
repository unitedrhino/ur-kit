import type { ChatWaitScheduler } from './wait-state';

/**
 * 文件说明：验证聊天等待状态机的延迟显示、超时升级与收敛时机。
 */
import { describe, expect, it } from 'vitest';

import { AI_WAIT_REVEAL_DELAY_MS, AI_WAIT_STALL_DELAY_MS, createChatWaitController } from './wait-state';

/** fakeScheduler 用假时钟驱动控制器，返回推进时间的句柄与视图变化记录。 */
function fakeScheduler() {
  const tasks = new Map<unknown, { at: number; run: () => void }>();
  let now = 0;
  let seq = 0;
  const scheduler: ChatWaitScheduler = {
    setTimeout: (callback, ms) => {
      const handle = Symbol(`t${seq++}`);
      tasks.set(handle, { at: now + ms, run: callback });
      return handle;
    },
    clearTimeout: (handle) => {
      tasks.delete(handle);
    },
  };
  return {
    scheduler,
    /** advance 推进假时钟并按到期顺序执行回调。 */
    advance(ms: number) {
      now += ms;
      for (const [handle, task] of [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)) {
        if (task.at <= now) {
          tasks.delete(handle);
          task.run();
        }
      }
    },
    pendingCount: () => tasks.size,
  };
}

function setup() {
  const clock = fakeScheduler();
  const views: Array<{ stalled: boolean; visible: boolean }> = [];
  const controller = createChatWaitController((view) => views.push(view), clock.scheduler);
  return { clock, controller, views };
}

describe('ai-chat 等待状态机', () => {
  it('生成开始后观察窗口内不显示加载态', () => {
    const { clock, controller, views } = setup();
    controller.update({ isLoading: true, hasContent: false });
    clock.advance(AI_WAIT_REVEAL_DELAY_MS - 1);
    expect(views).toEqual([]);
  });

  it('超过观察窗口仍无内容时显示加载态并挂上超时上限', () => {
    const { clock, controller, views } = setup();
    controller.update({ isLoading: true, hasContent: false });
    clock.advance(AI_WAIT_REVEAL_DELAY_MS);
    expect(views).toEqual([{ visible: true, stalled: false }]);
    expect(clock.pendingCount()).toBe(1);
  });

  it('加载态显示后超过 60 秒无内容升级为响应较慢', () => {
    const { clock, controller, views } = setup();
    controller.update({ isLoading: true, hasContent: false });
    clock.advance(AI_WAIT_REVEAL_DELAY_MS);
    clock.advance(AI_WAIT_STALL_DELAY_MS);
    expect(views.at(-1)).toEqual({ visible: true, stalled: true });
  });

  it('观察期内内容到达则不闪现加载态', () => {
    const { clock, controller, views } = setup();
    controller.update({ isLoading: true, hasContent: false });
    controller.update({ isLoading: true, hasContent: true });
    clock.advance(AI_WAIT_REVEAL_DELAY_MS * 5);
    expect(views).toEqual([]);
    expect(clock.pendingCount()).toBe(0);
  });

  it('内容到达或生成结束立即收敛并清理计时器', () => {
    const { clock, controller, views } = setup();
    controller.update({ isLoading: true, hasContent: false });
    clock.advance(AI_WAIT_REVEAL_DELAY_MS);
    controller.update({ isLoading: true, hasContent: true });
    expect(views.at(-1)).toEqual({ visible: false, stalled: false });
    expect(clock.pendingCount()).toBe(0);

    controller.update({ isLoading: true, hasContent: false });
    clock.advance(AI_WAIT_REVEAL_DELAY_MS);
    controller.update({ isLoading: false, hasContent: false });
    expect(views.at(-1)).toEqual({ visible: false, stalled: false });
    expect(clock.pendingCount()).toBe(0);
  });

  it('相同视图不重复回调，加载态可见期间仅重挂超时', () => {
    const { clock, controller, views } = setup();
    controller.update({ isLoading: true, hasContent: false });
    clock.advance(AI_WAIT_REVEAL_DELAY_MS);
    expect(views).toHaveLength(1);
    // 内容仍未到达的重复推进（重挂 stall）不应触发新视图
    controller.update({ isLoading: true, hasContent: false });
    clock.advance(AI_WAIT_STALL_DELAY_MS - 1);
    expect(views).toHaveLength(1);
  });

  it('dispose 后不再触发任何回调', () => {
    const { clock, controller, views } = setup();
    controller.update({ isLoading: true, hasContent: false });
    controller.dispose();
    clock.advance(AI_WAIT_STALL_DELAY_MS * 2);
    expect(views).toEqual([]);
    expect(clock.pendingCount()).toBe(0);
  });
});
