/**
 * 文件说明：任务进度轮询 composable，统一编译任务、ZIP 传输等进度查询的轮询生命周期。
 *
 * 列表页与工作台此前各自维护 setInterval 5s 轮询；本 composable 收敛重复实现：
 * 仅当任务处于进行态时 start，完成或组件卸载时自动 stop；页面不可见时暂停请求，
 * 恢复可见立即补拉一次，避免后台标签页堆积无效轮询。
 * 传输方式为后续 SSE/WS 预留接口：事件流接入后由推送回调直接调用 refresh 拉取增量，
 * interval 轮询退化为无推送场景的兜底实现，调用方无需感知差异。
 */
import { onUnmounted, ref } from 'vue';

export interface UseTaskPollingOptions {
  /** 轮询间隔毫秒数，默认 5000，与既有 5s 轮询节奏保持一致。 */
  interval?: number;
}

/** useTaskPolling 返回轮询开关与手动刷新入口；task 仅在页面可见时执行。 */
export function useTaskPolling(task: () => Promise<unknown> | unknown, options: UseTaskPollingOptions = {}) {
  const interval = options.interval ?? 5000;
  const active = ref(false);
  let timer: null | ReturnType<typeof setInterval> = null;

  /** tick 在页面可见时执行一次任务；后台标签页静默跳过，恢复可见时由监听器补拉。 */
  async function tick() {
    if (document.visibilityState !== 'visible') return;
    await task();
  }

  /** handleVisibilityChange 页面重新可见且轮询进行中时立即拉取，缩短数据陈旧窗口。 */
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && active.value) void tick();
  }

  /** start 启动轮询；重复调用不叠加定时器。 */
  function start() {
    if (timer) return;
    active.value = true;
    timer = setInterval(() => void tick(), interval);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /** stop 停止轮询并解除可见性监听；组件卸载时自动调用。 */
  function stop() {
    active.value = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  onUnmounted(stop);

  return { active, refresh: tick, start, stop };
}
