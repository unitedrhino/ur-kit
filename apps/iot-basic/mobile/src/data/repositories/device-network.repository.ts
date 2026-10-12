/** 设备网络入口权限：只复用现有查询，不签发 BLE 许可、不下发物模型。 */
import { request } from '../../utils/request';

/** NetworkGrantTarget 仅使用设备身份，项目归属始终重新查询。 */
export interface NetworkGrantTarget { productID: string; deviceName: string }

/** DeviceNetworkRepository 限制官方客户端入口；不代表 BLE 链路具备云端鉴权。 */
export class DeviceNetworkRepository {
  /** authorize 允许项目拥有者或明确项目管理授权；查询失败不放行。 */
  async authorize(target: NetworkGrantTarget): Promise<{ allowed: boolean }> {
    const device = await request<{ productID: string; deviceName: string; projectID: string }>({
      url: '/api/v1/things/device/info/get-one',
      data: { productID: target.productID, deviceName: target.deviceName },
    });
    if (String(device.productID) !== target.productID || device.deviceName !== target.deviceName
      || !device.projectID || String(device.projectID) === '0') return { allowed: false };
    const user = await request<{ userID: string }>({ url: '/api/v1/system/user/self/get-one', data: {} });
    if (!user.userID || String(user.userID) === '0') return { allowed: false };
    const project = await request<{ projectID: string; adminUserID: string; status: number }>({
      url: '/api/v1/things/project/info/get-one', data: { projectID: device.projectID },
    });
    if (String(project.projectID) !== String(device.projectID) || Number(project.status) !== 1) return { allowed: false };
    if (String(project.adminUserID) === String(user.userID)) return { allowed: true };
    const permissions = await request<{ list: { projectID: string; targetID: string; authType: number }[] }>({
      url: '/api/v1/things/data/project/get-list',
      data: { projectID: device.projectID, targetType: 'user', targetID: user.userID, page: { page: 1, size: 10 } },
    });
    return { allowed: (permissions.list ?? []).some((item) =>
      String(item.projectID) === String(device.projectID) && String(item.targetID) === String(user.userID)
      && Number(item.authType) === 1) };
  }
}
