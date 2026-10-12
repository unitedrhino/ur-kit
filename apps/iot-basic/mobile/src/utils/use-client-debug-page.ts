// 文件说明：随页面显示、隐藏与卸载注册调试控件，不保留后台页面的操作入口。
import { onShow, onHide, onUnload } from '@dcloudio/uni-app';
import { onUnmounted } from 'vue';
import { clientDebugControls, type DebugControl } from './client-debug-controls';
/** useClientDebugPage 将显式控件工厂绑定到页面生命周期；route 为不含查询参数的页面路径。 */
export function useClientDebugPage(route: string, controls: () => DebugControl[], state: () => Record<string, string | boolean> = () => ({})): void {
  /** release 只注销当前页面的注册，避免旧页卸载清除新页面。 */
  let release: (() => void) | undefined;
  /** clear 释放隐藏页面控件并撤销旧票据。 */
  const clear = () => { release?.(); release = undefined; };
  onShow(() => { clear(); release = clientDebugControls.activate(route, controls, state); });
  onHide(clear);
  onUnload(clear);
  onUnmounted(clear);
}
