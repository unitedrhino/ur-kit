/**
 * 文件说明：知识库弹层宽度记忆组合式函数，右缘拖拽调宽并持久化到 localStorage。
 *
 * 供高级信息、失败列表、编辑表单等信息型弹层复用：拖拽后刷新或重开弹层
 * 保持上次宽度；宽度始终被限制在可读下限与当前视口之间，窄屏由 CSS min()
 * 兜底收缩，不产生横向溢出。
 */
import { computed, ref } from 'vue';

/** localStorage 键前缀，完整键为 `kb-dialog-width:<scope>`。 */
const STORAGE_PREFIX = 'kb-dialog-width:';

/** 拖宽下限：再窄会挤压弹层内容，低于该值不生效。 */
export const DIALOG_MIN_WIDTH = 480;

/** 视口右侧保留边距，避免拖宽后弹层贴满或遮挡滚动条。 */
const VIEWPORT_MARGIN = 48;

export interface DialogWidthOptions {
  /** 未拖拽过时的默认宽度，应与弹层原有的 max-width 保持一致。 */
  defaultWidth: number;
}

/** 读取该弹层已记忆的宽度；未存储或值非法时返回 null。 */
function readStoredWidth(scope: string): null | number {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + scope);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** 持久化宽度；隐私模式下存储失败静默，仅影响下次记忆。 */
function persistWidth(scope: string, width: number) {
  try {
    localStorage.setItem(STORAGE_PREFIX + scope, String(width));
  } catch {
    // 存储不可用时放弃记忆，本次会话内宽度仍然生效
  }
}

/**
 * useDialogWidth 返回弹层宽度状态与拖拽入口。
 * @param scope 弹层标识，同一页面不同弹层使用不同 scope 隔离记忆
 * @param options 默认宽度等配置
 * @returns width 当前宽度；style 绑定到 DialogContent 的行内样式；
 *          startResize 在手柄 pointerdown 时调用；resetWidth 清除记忆恢复默认
 */
export function useDialogWidth(scope: string, options: DialogWidthOptions) {
  const width = ref(readStoredWidth(scope) ?? options.defaultWidth);

  /** clampWidth 限制在可读下限与当前视口可用宽度之间。 */
  function clampWidth(value: number): number {
    const maxWidth = Math.max(DIALOG_MIN_WIDTH, window.innerWidth - VIEWPORT_MARGIN);
    return Math.min(Math.max(Math.round(value), DIALOG_MIN_WIDTH), maxWidth);
  }

  /**
   * startResize 进入拖拽会话：指针移动时宽度跟随右缘距离，
   * 松开或取消后移除监听并持久化；拖拽中锁定全局光标与文本选择。
   */
  function startResize(event: PointerEvent) {
    event.preventDefault();
    const body = document.body;
    body.classList.add('kb-dialog-resizing');
    const move = (pointer: PointerEvent) => {
      width.value = clampWidth(window.innerWidth - pointer.clientX);
    };
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      body.classList.remove('kb-dialog-resizing');
      persistWidth(scope, width.value);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }

  /** resetWidth 清除记忆并恢复默认宽度，供弹层提供还原入口时使用。 */
  function resetWidth() {
    try {
      localStorage.removeItem(STORAGE_PREFIX + scope);
    } catch {
      // 存储不可用时仅恢复本次宽度
    }
    width.value = options.defaultWidth;
  }

  /** style 固定宽度但不超过视口可用空间，窄屏自动收缩不溢出。 */
  const style = computed(() => ({
    width: `min(${width.value}px, calc(100vw - 24px))`,
    maxWidth: `min(${width.value}px, calc(100vw - 24px))`,
  }));

  return { resetWidth, startResize, style, width };
}
