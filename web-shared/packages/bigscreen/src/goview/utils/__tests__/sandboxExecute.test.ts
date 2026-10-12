/**
 * P12 Worker 沙盒回归测试
 * 覆盖：sandboxExecute 核心逻辑 + AJAX / Pond 两种数据源过滤器
 *
 * 注意：测试环境无真实 Worker，自动走 fallback（主线程 new Function），
 * 验证的是过滤脚本执行逻辑本身的正确性。
 */
import { describe, expect, it } from 'vitest';

import { sandboxExecute } from '../sandboxExecute';

// ─── 1. sandboxExecute 核心逻辑 ───────────────────────────
describe('sandboxExecute 核心', () => {
  it('快路径：无 funcStr 直接返回原始 data', async () => {
    const data = [1, 2, 3];
    const result = await sandboxExecute(data, {});
    expect(result).toBe(data);
  });

  it('快路径：funcStr 为空字符串返回原始 data', async () => {
    const data = { a: 1 };
    const result = await sandboxExecute(data, {}, '');
    expect(result).toBe(data);
  });

  it('快路径：funcStr 为 undefined 返回原始 data', async () => {
    const data = [10, 20];
    const result = await sandboxExecute(data, {}, undefined);
    expect(result).toBe(data);
  });

  it('简单 return：原样返回 data', async () => {
    const data = { value: 42 };
    const result = await sandboxExecute(data, {}, 'return data');
    expect(result).toEqual({ value: 42 });
  });

  it('数组变换：map 操作', async () => {
    const data = [1, 2, 3];
    const filter = 'return data.map(v => v * 10)';
    const result = await sandboxExecute(data, {}, filter);
    expect(result).toEqual([10, 20, 30]);
  });

  it('使用 res 参数', async () => {
    const data = [1, 2];
    const res = { multiplier: 5 };
    const filter = 'return data.map(v => v * res.multiplier)';
    const result = await sandboxExecute(data, res, filter);
    expect(result).toEqual([5, 10]);
  });

  it('脚本错误：返回原始 data（不抛异常）', async () => {
    const data = [1, 2, 3];
    const filter = 'throw new Error("boom")';
    const result = await sandboxExecute(data, {}, filter);
    expect(result).toEqual([1, 2, 3]);
  });

  it('语法错误脚本：返回原始 data', async () => {
    const data = { x: 1 };
    const filter = 'return {{invalid syntax}}';
    const result = await sandboxExecute(data, {}, filter);
    expect(result).toEqual({ x: 1 });
  });

  it('对象提取：从嵌套结构取值', async () => {
    const data = { info: { list: [10, 20] } };
    const filter = 'return data.info.list';
    const result = await sandboxExecute(data, {}, filter);
    expect(result).toEqual([10, 20]);
  });

  it('数组过滤：filter 操作', async () => {
    const data = [
      { name: 'A', value: 10 },
      { name: 'B', value: 50 },
      { name: 'C', value: 30 },
    ];
    const filter = 'return data.filter(d => d.value > 20)';
    const result = await sandboxExecute(data, {}, filter);
    expect(result).toEqual([
      { name: 'B', value: 50 },
      { name: 'C', value: 30 },
    ]);
  });
});

// ─── 2. AJAX 数据源回归（useChartDataFetch / ChartDataAjax） ──────
describe('aJAX 数据源过滤器', () => {
  // 模拟 customizeHttp 返回的典型 AJAX 响应
  const ajaxRes = {
    data: {
      dimensions: ['product', 'sales', 'profit'],
      source: [
        { product: '手机', sales: 120, profit: 30 },
        { product: '电脑', sales: 80, profit: 45 },
        { product: '平板', sales: 60, profit: 15 },
      ],
    },
    status: 200,
  };

  it('无过滤器：直接返回 res.data', async () => {
    const result = await sandboxExecute(ajaxRes.data, ajaxRes);
    expect(result).toBe(ajaxRes.data);
  });

  it('提取 source 数组', async () => {
    const filter = 'return data.source';
    const result = await sandboxExecute(ajaxRes.data, ajaxRes, filter);
    expect(result).toHaveLength(3);
    expect(result[0].product).toBe('手机');
  });

  it('过滤 + 映射：只取高利润产品', async () => {
    const filter = `
      return data.source
        .filter(item => item.profit > 20)
        .map(item => ({ name: item.product, value: item.profit }))
    `;
    const result = await sandboxExecute(ajaxRes.data, ajaxRes, filter);
    expect(result).toEqual([
      { name: '手机', value: 30 },
      { name: '电脑', value: 45 },
    ]);
  });

  it('使用 res 中的 status 做条件判断', async () => {
    const filter = `
      if (res.status !== 200) return []
      return data.source.map(d => d.product)
    `;
    const result = await sandboxExecute(ajaxRes.data, ajaxRes, filter);
    expect(result).toEqual(['手机', '电脑', '平板']);
  });

  it('eCharts dataset 格式转换', async () => {
    const filter = `
      return {
        dimensions: data.dimensions,
        source: data.source
      }
    `;
    const result = await sandboxExecute(ajaxRes.data, ajaxRes, filter);
    expect(result.dimensions).toEqual(['product', 'sales', 'profit']);
    expect(result.source).toHaveLength(3);
  });
});

// ─── 3. 数据池(Pond) 数据源回归（useChartDataPondFetch / ChartDataPond） ──
describe('数据池(Pond) 数据源过滤器', () => {
  // 模拟数据池公共接口返回
  const pondRes = {
    data: [
      { id: 1, name: '设备A', status: 'online', cpu: 45 },
      { id: 2, name: '设备B', status: 'offline', cpu: 0 },
      { id: 3, name: '设备C', status: 'online', cpu: 78 },
      { id: 4, name: '设备D', status: 'online', cpu: 92 },
    ],
    code: 200,
  };

  it('无过滤器：直接返回 res.data', async () => {
    const result = await sandboxExecute(pondRes.data, pondRes);
    expect(result).toBe(pondRes.data);
  });

  it('状态过滤：只取在线设备', async () => {
    const filter = "return data.filter(d => d.status === 'online')";
    const result = await sandboxExecute(pondRes.data, pondRes, filter);
    expect(result).toHaveLength(3);
    expect(result.every((d: any) => d.status === 'online')).toBe(true);
  });

  it('字段映射：转为 ECharts 饼图数据', async () => {
    const filter = `
      return data
        .filter(d => d.status === 'online')
        .map(d => ({ name: d.name, value: d.cpu }))
    `;
    const result = await sandboxExecute(pondRes.data, pondRes, filter);
    expect(result).toEqual([
      { name: '设备A', value: 45 },
      { name: '设备C', value: 78 },
      { name: '设备D', value: 92 },
    ]);
  });

  it('多组件共享数据池：不同 filter 独立执行', async () => {
    // 组件 A：取设备名列表
    const filterA = 'return data.map(d => d.name)';
    const resultA = await sandboxExecute(pondRes.data, pondRes, filterA);
    expect(resultA).toEqual(['设备A', '设备B', '设备C', '设备D']);

    // 组件 B：取 CPU 均值
    const filterB = `
      const online = data.filter(d => d.status === 'online')
      const avg = online.reduce((s, d) => s + d.cpu, 0) / online.length
      return [{ name: 'CPU均值', value: Math.round(avg) }]
    `;
    const resultB = await sandboxExecute(pondRes.data, pondRes, filterB);
    expect(resultB).toEqual([{ name: 'CPU均值', value: 72 }]);
  });

  it('使用 res.code 做条件判断', async () => {
    const filter = `
      if (res.code !== 200) return []
      return data.map(d => d.id)
    `;
    const result = await sandboxExecute(pondRes.data, pondRes, filter);
    expect(result).toEqual([1, 2, 3, 4]);
  });
});
