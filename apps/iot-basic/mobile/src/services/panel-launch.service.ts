/** 文件说明：整页面板入口服务，固定第一方H5路径，不接收任意跳转地址。 */
import { PanelLaunchRepository } from '../data/repositories/panel-launch.repository';
import type { IPanelLaunchRepository, PanelHandoff } from '../domain/interfaces/panel-launch.repository';
import { config } from '../config';
/** PanelLaunchService 仅将短票据放入fragment，长期令牌只在HTTPS响应中交接。 */
export class PanelLaunchService {
  /** repo 为平台入口仓储，测试可替换其网络边界。 */
  constructor(private readonly repo: IPanelLaunchRepository = new PanelLaunchRepository()) {}
  /** create 返回当前设备整页入口；无绑定返回空字符串，平台错误继续抛出。 */
  async create(productID: string, deviceName: string): Promise<string> {
    const launch = await this.repo.create(productID, deviceName);
    if (launch.mode === 'builtin') return '';
    if (launch.mode !== 'panel' || !launch.ticket || !/^[a-f0-9]{64}$/.test(launch.ticket) || !launch.expiresAt || launch.expiresAt <= Date.now()) {
      throw new Error('面板入口无效，请重试');
    }
    if (!config.apiBaseUrl.startsWith('https://')) throw new Error('微信面板需要可访问的HTTPS服务地址');
    return config.apiBaseUrl.replace(/\/$/, '') + '/api/v1/things/panel/host/index.html#panelTicket=' + launch.ticket + '&appID=' + encodeURIComponent(config.appId) + '&nativeNav=1';
  }
  /** installSession 只在Provider确认原页面和账号仍有效后写入认证。 */
  installSession(token: string): void { this.repo.install(token); }
  /** exchange 拒绝异常票据，凭据只交给Provider恢复会话，不暴露给页面。 */
  exchange(ticket: string): Promise<PanelHandoff> {
    if (!/^[a-f0-9]{64}$/.test(ticket)) return Promise.reject(new Error('面板入口已失效，请返回设备重试'));
    return this.repo.exchange(ticket);
  }
}
/** panelLaunchService 复用真实平台服务，不缓存一次性票据。 */
export const panelLaunchService = new PanelLaunchService();
