/** 文件说明：微信整页H5面板的一次性入口与固定上下文合同。 */
/** PanelLaunch 是当前设备绑定检查后的短期入口，builtin不携带凭据。 */
export interface PanelLaunch { mode: 'panel' | 'builtin'; reason?: string; ticket?: string; expiresAt?: number }
/** PanelHandoff 仅由服务端票据兑换获得，不允许路由改写账号和设备。 */
export interface PanelHandoff { token: string; appID: string; tenantCode: string; projectID: string; productID: string; deviceName: string }
/** IPanelLaunchRepository 隔离平台调用与认证令牌存储，不让UI接触凭据。 */
export interface IPanelLaunchRepository {
  /** create 按真实设备和当前身份创建H5入口。 */
  create(productID: string, deviceName: string): Promise<PanelLaunch>;
  /** exchange 原子兑换入口，校验应用后安装原登录身份，凭据不写入URL。 */
  exchange(ticket: string): Promise<PanelHandoff>;
  /** install 仅在页面仍有效且旧认证未变化时安装凭据。 */
  install(token: string): void;
}
