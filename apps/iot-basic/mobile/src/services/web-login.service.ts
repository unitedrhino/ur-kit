/** 小程序电脑登录服务：只编排手机端票据操作，不操作页面或 Provider。 */
import { WebLoginRepository } from '../data/repositories/web-login.repository';
import type { WebLoginAction, WebLoginSession } from '../domain/models/web-login.model';
import type { IWebLoginRepository } from '../domain/interfaces/web-login.repository';
/** WebLoginService 接收可替换的数据仓库依赖，隔离平台请求。 */
export class WebLoginService {
  /** repo 为统一鉴权的扫码确认数据仓库。 */
  constructor(private readonly repo: IWebLoginRepository = new WebLoginRepository()) {}
  /** describeBinding 校验手机票据后读取接收账号，独立于平台登录和注册。 */
  describeBinding(state: string): Promise<WebLoginSession> {
    if (!/^[a-f0-9]{64}$/.test(state)) return Promise.reject(new Error('授权链接无效，请重新扫码'));
    return this.repo.describeBinding(state);
  }
  /** approveBinding 仅在用户显式确认时获取当前微信授权码；拒绝不触发微信登录。 */
  async approveBinding(state: string, action: 'confirm' | 'reject'): Promise<WebLoginSession> {
    if (!/^[a-f0-9]{64}$/.test(state)) throw new Error('授权链接无效，请重新扫码');
    let code: string | undefined;
    if (action === 'confirm') {
      code = await new Promise<string>((resolve, reject) => {
        uni.login({ provider: 'weixin', success: result => result.code ? resolve(result.code) : reject(new Error('微信授权失败，请重试')), fail: () => reject(new Error('微信授权失败，请重试')) });
      });
    }
    return this.repo.approveBinding(state, action, code);
  }
  /** approve 校验票据基本格式后执行手机端确认动作。 */
  approve(ticket: string, action: WebLoginAction): Promise<WebLoginSession> {
    if (!/^[a-f0-9]{64}$/.test(ticket)) return Promise.reject(new Error('扫码链接无效，请重新扫码'));
    return this.repo.approve(ticket, action);
  }
}
/** webLoginService 为页面提供统一电脑登录服务。 */
export const webLoginService = new WebLoginService();
