/** 文件说明：衔接小程序原身份到第一方H5，再按平台当前权限加载固定设备面板。 */
import { panelLaunchService } from '../services/panel-launch.service';
import { prepareMiniPanelNavigation } from '../services/mini-panel-navigation.service';
import { authProvider } from './auth.provider';
import { tenantProvider } from './tenant.provider';
import { currentFamilyProvider } from './current-family.provider';
import { appContextProvider } from './app-context.provider';
/** openPanelHandoff 不向UI返回令牌；仅允许服务器返回的企业、项目和设备。 */
export async function openPanelHandoff(ticket: string, isActive: () => boolean = () => true): Promise<void> {
  const previousUser = authProvider.getState().user;
  /** assertActive 拒绝页面卸载或另一账号登录后到达的兑换，不能重启已关闭页面。 */
  const assertActive = (): void => { if (!isActive()) throw new Error('面板页面已关闭'); };
  const session = await panelLaunchService.exchange(ticket);
  assertActive();
  const currentUser = authProvider.getState().user;
  if (previousUser?.userID !== currentUser?.userID || previousUser?.token !== currentUser?.token) throw new Error('登录状态已变化，请重新进入设备');
  panelLaunchService.installSession(session.token);
  await authProvider.restorePanelSession(isActive);
  assertActive();
  await tenantProvider.loadTenants();
  assertActive();
  if (!tenantProvider.switchTenant(session.tenantCode)) throw new Error('当前账号无法访问面板所属企业');
  currentFamilyProvider.switchFamily(session.projectID, '', session.tenantCode);
  const route = '/packageDevice/pages/detail/index?productID=' + encodeURIComponent(session.productID) + '&deviceName=' + encodeURIComponent(session.deviceName);
  if (!(await appContextProvider.ensureReady(route, true))) throw new Error('当前账号无法访问面板所属项目');
  assertActive();
  if (currentFamilyProvider.getState().projectID !== session.projectID) throw new Error('设备项目已变化，请返回重新打开');
  await prepareMiniPanelNavigation({ productID: session.productID, deviceName: session.deviceName });
  assertActive();
  await new Promise<void>((resolve, reject) => uni.redirectTo({ url: route, success: () => resolve(), fail: () => reject(new Error('面板页面打开失败')) }));
}
