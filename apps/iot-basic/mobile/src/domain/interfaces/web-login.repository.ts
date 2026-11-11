/** 电脑扫码登录的数据访问接口，仅定义领域契约。 */
import type { WebLoginAction, WebLoginSession } from '../models/web-login.model';
/** IWebLoginRepository 抽象跨端登录请求，便于服务层注入测试替身。 */
export interface IWebLoginRepository {
  /** describeBinding 读取手机可见的绑定确认信息，不要求平台登录。 */
  describeBinding(state: string): Promise<WebLoginSession>;
  /** approveBinding 提交显式确认及当前微信一次性授权码。 */
  approveBinding(state: string, action: 'confirm' | 'reject', code?: string): Promise<WebLoginSession>;
  /** approve 提交票据及手机端动作，返回公开会话信息。 */
  approve(ticket: string, action: WebLoginAction): Promise<WebLoginSession>;
}
