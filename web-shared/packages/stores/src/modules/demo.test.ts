/**
 * Vitest 单元测试 Demo — 场景三：Pinia Store 测试
 *
 * 作为后续单元测试的参考模板，展示 Pinia Store 测试的完整模式：
 *   - beforeEach 重置 Pinia 实例，隔离测试状态
 *   - 测试 state、getters（computed）、actions
 *   - 测试异步 action 的 loading 状态翻转
 *   - 用 vi.fn() mock 外部依赖
 */

import { createPinia, defineStore, setActivePinia } from 'pinia';
import { computed, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────
// Demo Store 定义（实际业务中放在 src/modules/ 下）
// ─────────────────────────────────────────────

interface Device {
  id: string;
  name: string;
  status: number; // 0: 离线, 1: 在线, 2: 故障
}

const useDeviceStore = defineStore('device-demo', () => {
  const devices = ref<Device[]>([]);
  const loading = ref(false);

  /** 在线设备数量 */
  const onlineCount = computed(
    () => devices.value.filter((d) => d.status === 1).length,
  );

  /** 按状态过滤 */
  const byStatus = computed(
    () => (status: number) => devices.value.filter((d) => d.status === status),
  );

  function addDevice(device: Device) {
    devices.value.push(device);
  }

  function updateStatus(id: string, status: number) {
    const device = devices.value.find((d) => d.id === id);
    if (device) device.status = status;
  }

  function clearDevices() {
    devices.value = [];
  }

  /** 模拟异步加载，接受外部 fetcher 方便测试时注入 mock */
  async function fetchDevices(fetcher: () => Promise<Device[]>) {
    loading.value = true;
    try {
      devices.value = await fetcher();
    } finally {
      loading.value = false;
    }
  }

  return {
    devices,
    loading,
    onlineCount,
    byStatus,
    addDevice,
    updateStatus,
    clearDevices,
    fetchDevices,
  };
});

// ─────────────────────────────────────────────
// 场景三：Pinia Store 测试
// ─────────────────────────────────────────────

describe('场景三：Pinia Store 测试', () => {
  beforeEach(() => {
    // 每个测试前重置 Pinia 实例，确保状态完全隔离
    setActivePinia(createPinia());
  });

  it('初始状态为空', () => {
    const store = useDeviceStore();
    expect(store.devices).toHaveLength(0);
    expect(store.onlineCount).toBe(0);
    expect(store.loading).toBe(false);
  });

  it('addDevice 添加设备', () => {
    const store = useDeviceStore();
    store.addDevice({ id: 'd1', name: '温度传感器', status: 1 });
    expect(store.devices).toHaveLength(1);
    expect(store.devices[0].name).toBe('温度传感器');
  });

  it('onlineCount 正确计算在线数量', () => {
    const store = useDeviceStore();
    store.addDevice({ id: 'd1', name: '传感器A', status: 1 });
    store.addDevice({ id: 'd2', name: '传感器B', status: 0 });
    store.addDevice({ id: 'd3', name: '传感器C', status: 1 });
    expect(store.onlineCount).toBe(2);
  });

  it('byStatus getter 按状态过滤', () => {
    const store = useDeviceStore();
    store.addDevice({ id: 'd1', name: '传感器A', status: 1 });
    store.addDevice({ id: 'd2', name: '传感器B', status: 0 });
    store.addDevice({ id: 'd3', name: '传感器C', status: 2 });
    expect(store.byStatus(1)).toHaveLength(1);
    expect(store.byStatus(0)).toHaveLength(1);
    expect(store.byStatus(2)).toHaveLength(1);
  });

  it('updateStatus 更新设备状态', () => {
    const store = useDeviceStore();
    store.addDevice({ id: 'd1', name: '传感器A', status: 1 });
    store.updateStatus('d1', 0);
    expect(store.devices[0].status).toBe(0);
    expect(store.onlineCount).toBe(0);
  });

  it('updateStatus 更新不存在的设备 - 无副作用', () => {
    const store = useDeviceStore();
    store.addDevice({ id: 'd1', name: '传感器A', status: 1 });
    store.updateStatus('not-exist', 0);
    // 原设备状态不变
    expect(store.devices[0].status).toBe(1);
  });

  it('clearDevices 清空设备列表', () => {
    const store = useDeviceStore();
    store.addDevice({ id: 'd1', name: '传感器A', status: 1 });
    store.clearDevices();
    expect(store.devices).toHaveLength(0);
  });

  it('fetchDevices 异步加载：loading 状态正确翻转', async () => {
    const store = useDeviceStore();
    const mockData: Device[] = [{ id: 'd1', name: '网关', status: 1 }];
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const promise = store.fetchDevices(fetcher);
    // 请求发起时 loading 为 true
    expect(store.loading).toBe(true);

    await promise;
    // 请求完成后 loading 恢复 false
    expect(store.loading).toBe(false);
    expect(store.devices).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('fetchDevices 异步加载失败时 loading 归位', async () => {
    const store = useDeviceStore();
    const fetcher = vi.fn().mockRejectedValue(new Error('网络错误'));

    await expect(store.fetchDevices(fetcher)).rejects.toThrow('网络错误');
    expect(store.loading).toBe(false);
    expect(store.devices).toHaveLength(0);
  });
});
