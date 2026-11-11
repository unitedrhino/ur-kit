/** 多选状态：按产品和设备标识区分设备，供首页与设备列表复用。 */
import { ref } from 'vue';
import type { DeviceEntity } from '../domain/entities/device.entity';

/** deviceSelectionKey 使用完整设备身份，避免不同产品下同名设备冲突。 */
export function deviceSelectionKey(device: DeviceEntity): string {
  return JSON.stringify([device.productID, device.deviceName]);
}

/** useDeviceSelection 创建页面局部的选择状态，不污染设备列表筛选。 */
export function useDeviceSelection() {
  const active = ref(false);
  const selected = ref<DeviceEntity[]>([]);
  /** isSelected 判断指定设备是否已勾选。 */
  function isSelected(device: DeviceEntity): boolean { return selected.value.some(item => deviceSelectionKey(item) === deviceSelectionKey(device)); }
  /** begin 从长按设备开始选择。 */
  function begin(device: DeviceEntity): void { active.value = true; selected.value = [device]; }
  /** toggle 改变单台设备的选择状态。 */
  function toggle(device: DeviceEntity): void {
    selected.value = isSelected(device) ? selected.value.filter(item => deviceSelectionKey(item) !== deviceSelectionKey(device)) : [...selected.value, device];
  }
  /** clear 退出选择并清理临时状态。 */
  function clear(): void { active.value = false; selected.value = []; }
  /** retain 保留尚未成功移动的设备，方便明确重试。 */
  function retain(devices: DeviceEntity[]): void { selected.value = devices; if (!devices.length) active.value = false; }
  return { active, selected, isSelected, begin, toggle, clear, retain };
}
