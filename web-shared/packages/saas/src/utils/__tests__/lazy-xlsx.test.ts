// 验证 VXE 按操作加载，保留插件结果与非 XLSX 行为。
import { describe, expect, it, vi } from 'vitest';
import { installLazyXlsx } from '../../adapter/lazy-xlsx';

const state = vi.hoisted(() => ({ installs: 0, exports: 0, imports: 0, fail: false }));
vi.mock('../load-excel', () => ({
  loadExcel: vi.fn(async () => {
    if (state.fail) throw new Error('断网');
    return {};
  }),
}));
const pluginInstance = {
  install(core: any) {
    state.installs++;
    core.interceptor.mixin({
      'event.export': () => ({ status: false, result: Promise.resolve(++state.exports) }),
      'event.import': () => ({ status: false, result: Promise.resolve(++state.imports) }),
    });
  },
};

// 与真实包一致提供 default 与命名导出两种形态（lazy-xlsx 的归一化会按 install 特征选取）。
vi.mock('@vxe-ui/plugin-export-xlsx', () => ({
  default: pluginInstance,
  VxeUIPluginExportXLSX: pluginInstance,
}));

/** 创建带可回读拦截器的最小 VXE 实例。 */
function fixture() {
  const handlers: Record<string, (params: any) => any> = {};
  const core = {
    setConfig: vi.fn(),
    interceptor: {
      mixin(entries: object) {
        Object.assign(handlers, entries);
      },
    },
  };
  installLazyXlsx(core as any);
  installLazyXlsx(core as any);
  return { core, handlers };
}

describe('XLSX 延迟入口', () => {
  it('空闲及 CSV 不装配插件，并发操作仅初始化一次且各自完成一次', async () => {
    const { core, handlers } = fixture();
    expect(state.installs).toBe(0);
    expect(handlers['event.export']!({ options: { type: 'csv' } })).toBeUndefined();
    const first = handlers['event.export']!({ options: { type: 'xlsx' } });
    const second = handlers['event.export']!({ options: { type: 'xlsx' } });
    expect(first.status).toBe(false);
    expect(await Promise.all([first.result, second.result])).toEqual([1, 2]);
    expect(state.installs).toBe(1);
    expect(core.setConfig).toHaveBeenCalledTimes(1);
    expect(await handlers['event.import']!({ options: { type: 'xlsx' } }).result).toBe(1);
  });
  it('加载失败不执行导出，下一次可重试', async () => {
    const { handlers } = fixture();
    state.fail = true;
    const count = state.exports;
    await expect(handlers['event.export']!({ options: { type: 'xlsx' } }).result).rejects.toThrow('断网');
    expect(state.exports).toBe(count);
    state.fail = false;
    await expect(handlers['event.export']!({ options: { type: 'xlsx' } }).result).resolves.toBe(count + 1);
  });
});
