/** 设备批量移动：逐台核实项目与共享身份，保留逐台结果，避免隐藏部分失败。 */
import { deviceService } from './device.service';
import type { DeviceEntity } from '../domain/entities/device.entity';

/** DeviceMoveResult 包含已确认移动和未完成的设备及原因。 */
export interface DeviceMoveResult {
  moved: DeviceEntity[];
  failed: Array<{ device: DeviceEntity; message: string }>;
}

/** moveDevicesToArea 逐台移动并回读结果；上下文变化时不再继续写入。 */
export async function moveDevicesToArea(
  devices: DeviceEntity[], projectID: string, areaID: string, isCurrent: () => boolean,
): Promise<DeviceMoveResult> {
  const result: DeviceMoveResult = { moved: [], failed: [] };
  for (const device of devices) {
    let updateAttempted = false;
    try {
      if (!isCurrent()) throw new Error('当前项目已切换');
      const current = await deviceService.getDetail(device.productID, device.deviceName);
      if (!isCurrent()) throw new Error('当前项目已切换');
      if (current.projectID !== projectID || current.isShared !== false) throw new Error('该设备不属于当前项目或为收到的分享');
      if (current.areaID !== areaID) {
        updateAttempted = true;
        await deviceService.update({ productID: device.productID, deviceName: device.deviceName, areaID });
        const updated = await deviceService.getDetail(device.productID, device.deviceName);
        if (updated.projectID !== projectID || updated.areaID !== areaID) throw new Error('保存后区域未更新，请重试');
      }
      result.moved.push(device);
    } catch (error) {
      // 请求可能已写入但响应丢失；在同一上下文内回读，避免误报失败。
      if (updateAttempted && isCurrent()) {
        try {
          const latest = await deviceService.getDetail(device.productID, device.deviceName);
          if (latest.projectID === projectID && latest.areaID === areaID) { result.moved.push(device); continue; }
        } catch { /* 状态未知时保留失败项，由用户刷新或重试。 */ }
      }
      result.failed.push({ device, message: (error as Error).message || '移动失败，请刷新后重试' });
    }
  }
  return result;
}
