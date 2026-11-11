/** 小程序可见的电脑登录会话；不包含电脑查询密钥或登录令牌。 */
export interface WebLoginSession {
  /** 服务端会话状态。 */
  status: string;
  /** 绑定授权的接收账号昵称；不包含手机号或第三方完整身份。 */
  accountName?: string;
  /** 当前授权渠道。 */
  provider?: string;
  /** 服务端读取的目标应用名称。 */
  appName?: string;
  /** 服务端到期毫秒时间戳。 */
  expiresAt?: number | string;
}
/** 小程序仅能领取、确认或拒绝，不能执行电脑端兑换。 */
export type WebLoginAction = 'claim' | 'confirm' | 'reject';
