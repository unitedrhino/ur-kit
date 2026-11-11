/** 文件说明：原生面板窗口基础设施的服务入口；Provider 只消费服务，不依赖数据源。 */
import { openNativePanel } from "../data/datasources/panel-runtime.datasource";
import type {
  NativePanelConfiguration,
  NativePanelHandle,
} from "../data/datasources/panel-runtime.datasource";
export type { NativePanelHandle } from "../data/datasources/panel-runtime.datasource";
/** PanelRuntimeService 装配固定可信壳的本机传输，不持有 UI 页面状态。 */
export class PanelRuntimeService {
  open(
    config: NativePanelConfiguration,
    call: (method: string, params: Record<string, any>) => Promise<unknown>,
  ): NativePanelHandle {
    return openNativePanel(config, call);
  }
}
export const panelRuntimeService = new PanelRuntimeService();
