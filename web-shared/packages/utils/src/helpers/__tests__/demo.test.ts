/**
 * Vitest 单元测试 Demo — 场景一&二
 *
 * 作为后续单元测试的参考模板，覆盖两种常见场景：
 *   1. 纯函数工具测试
 *   2. Vue 组件测试（@vue/test-utils）
 *
 * 对应 Pinia Store 测试见 packages/stores/src/modules/demo.test.ts
 */

import { mount } from '@vue/test-utils';
import { computed, defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────
// 场景一：纯函数工具测试
// ─────────────────────────────────────────────

/** 格式化设备状态码为中文描述 */
function formatDeviceStatus(status: number): string {
  const map: Record<number, string> = {
    0: '离线',
    1: '在线',
    2: '故障',
  };
  return map[status] ?? '未知';
}

/** 将字节数格式化为可读字符串 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

describe('场景一：纯函数工具测试', () => {
  describe('formatDeviceStatus', () => {
    it('状态 0 → 离线', () => {
      expect(formatDeviceStatus(0)).toBe('离线');
    });

    it('状态 1 → 在线', () => {
      expect(formatDeviceStatus(1)).toBe('在线');
    });

    it('状态 2 → 故障', () => {
      expect(formatDeviceStatus(2)).toBe('故障');
    });

    it('未知状态码 → 未知', () => {
      expect(formatDeviceStatus(99)).toBe('未知');
    });
  });

  describe('formatBytes', () => {
    it('0 字节', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('1024 字节 → 1 KB', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('1.5 MB', () => {
      expect(formatBytes(1_572_864)).toBe('1.5 MB');
    });

    it('支持自定义小数位数', () => {
      expect(formatBytes(1500, 0)).toBe('1 KB');
    });
  });
});

// ─────────────────────────────────────────────
// 场景二：Vue 组件测试
// ─────────────────────────────────────────────

/** 简单的状态徽章组件 */
const StatusBadge = defineComponent({
  name: 'StatusBadge',
  props: {
    status: {
      type: Number,
      required: true,
    },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const label = computed(() => formatDeviceStatus(props.status));
    const colorClass = computed(() => {
      const classes: Record<number, string> = {
        0: 'text-gray-500',
        1: 'text-green-500',
        2: 'text-red-500',
      };
      return classes[props.status] ?? 'text-gray-400';
    });

    function handleClick() {
      emit('click', props.status);
    }

    return { label, colorClass, handleClick };
  },
  template: `
    <span :class="colorClass" data-testid="badge" @click="handleClick">
      {{ label }}
    </span>
  `,
});

describe('场景二：Vue 组件测试', () => {
  it('渲染在线状态', () => {
    const wrapper = mount(StatusBadge, { props: { status: 1 } });
    expect(wrapper.text()).toBe('在线');
    expect(wrapper.classes()).toContain('text-green-500');
  });

  it('渲染离线状态', () => {
    const wrapper = mount(StatusBadge, { props: { status: 0 } });
    expect(wrapper.text()).toBe('离线');
    expect(wrapper.classes()).toContain('text-gray-500');
  });

  it('渲染故障状态', () => {
    const wrapper = mount(StatusBadge, { props: { status: 2 } });
    expect(wrapper.text()).toBe('故障');
    expect(wrapper.classes()).toContain('text-red-500');
  });

  it('点击时触发 click 事件并携带状态值', async () => {
    const wrapper = mount(StatusBadge, { props: { status: 1 } });
    await wrapper.find('[data-testid="badge"]').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')![0]).toEqual([1]);
  });

  it('props 变更后重新渲染', async () => {
    const wrapper = mount(StatusBadge, { props: { status: 1 } });
    expect(wrapper.text()).toBe('在线');
    await wrapper.setProps({ status: 0 });
    expect(wrapper.text()).toBe('离线');
  });
});
