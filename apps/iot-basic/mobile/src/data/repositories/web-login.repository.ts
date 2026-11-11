/** 小程序电脑登录数据适配器：统一使用带应用和登录态的请求基础设施。 */
import { request } from '../../utils/request';
import type { WebLoginAction, WebLoginSession } from '../../domain/models/web-login.model';
import type { IWebLoginRepository } from '../../domain/interfaces/web-login.repository';
/** WebLoginRepository 将手机端动作映射到鉴权后的扫码确认接口。 */
export class WebLoginRepository implements IWebLoginRepository {
  /** describeBinding 仅凭后端签发的手机票据获取脱敏确认信息。 */
  describeBinding(state: string): Promise<WebLoginSession> {
    return request<WebLoginSession>({ url: '/api/v1/system/user/self/third-binding/session/get-one', data: { state } });
  }
  /** approveBinding 不传用户编号或旧绑定身份，目标只由服务端会话决定。 */
  approveBinding(state: string, action: 'confirm' | 'reject', code?: string): Promise<WebLoginSession> {
    return request<WebLoginSession>({ url: '/api/v1/system/user/self/third-binding/approve', data: { state, action, code } });
  }
  /** approve 不接收用户编号，身份完全来自已验证登录令牌。 */
  approve(ticket: string, action: WebLoginAction): Promise<WebLoginSession> {
    return request<WebLoginSession>({ url: '/api/v1/system/user/self/wx-mini-qr/approve', data: { ticket, action } });
  }
}
