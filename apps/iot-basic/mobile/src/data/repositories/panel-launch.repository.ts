/** 文件说明：登录交接只走平台POST接口；票据和令牌不写入日志或离线面板缓存。 */
import { request } from '../../utils/request';
import { config } from '../../config';
import type { IPanelLaunchRepository, PanelLaunch, PanelHandoff } from '../../domain/interfaces/panel-launch.repository';
/** PanelLaunchRepository 在确认应用身份后使用现有认证存储衔接第一方H5。 */
export class PanelLaunchRepository implements IPanelLaunchRepository {
  /** create 无可用绑定时保留服务端builtin语义，失败不冒充未绑定。 */
  create(productID: string, deviceName: string): Promise<PanelLaunch> {
    return request({ url: '/api/v1/things/panel/launch/create', data: { productID, deviceName } });
  }
  /** exchange 只接收随机一次性票据并校验响应，本方法不写认证存储。 */
  async exchange(ticket: string): Promise<PanelHandoff> {
    const result = await request<PanelHandoff>({ url: '/api/v1/things/panel/launch/exchange', data: { ticket } });
    if (!result.token || String(result.appID) !== String(config.appId) || !result.productID || !result.deviceName || !result.tenantCode || !result.projectID) {
      throw new Error('面板登录信息无效，请返回设备重试');
    }
    return result;
  }
  /** install 只由已校验页面生命周期的Provider调用，兑换本身不改变认证存储。 */
  install(token: string): void { uni.setStorageSync('token', token); }
}
