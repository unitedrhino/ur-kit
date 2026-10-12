// 保留 VXE 的 XLSX 菜单入口，在实际导入或导出时才装配原插件。
import type VxeUIPluginExportXLSX from '@vxe-ui/plugin-export-xlsx';

import { createLazyResource } from '../utils/lazy-resource';
import { loadExcel } from '../utils/load-excel';

/** 与已安装插件保持相同的 VXE 实例合同。 */
type VxeUIExport = Parameters<typeof VxeUIPluginExportXLSX.install>[0];

/** 原插件注册的拦截器集合，用于保留导入导出的原始异步语义。 */
type Handlers = Parameters<VxeUIExport['interceptor']['mixin']>[0];
/** 已登记的 VXE 实例，防止重复初始化产生重复下载。 */
const registered = new WeakSet<VxeUIExport>();

/** 注册轻量 XLSX 入口；core 是当前应用使用的 VXE 实例。 */
export function installLazyXlsx(core: VxeUIExport): void {
  if (registered.has(core)) return;
  registered.add(core);
  // 先保留格式选项，不让尚未加载的插件导致 XLSX 从导出面板消失。
  core.setConfig({
    table: { importConfig: { _typeMaps: { xlsx: 1 } }, exportConfig: { _typeMaps: { xlsx: 1 } } },
  });
  // 用独立代理收集原插件回调，不替换全局 interceptor，也不递归重放导出。
  const loadHandlers = createLazyResource(async () => {
    const [xlsxNamespace, ExcelJS] = await Promise.all([import('@vxe-ui/plugin-export-xlsx'), loadExcel()]);
    // 兼容不同打包器的 CJS 互操作语义：该插件是带 `__esModule` 的 TS 编译 CJS，
    // rolldown（vite 8）不穿透 exports.default，namespace.default 会变成整个
    // module.exports（顶层无 install）；取第一个带 install 的形态作为插件。
    const pluginCandidates: unknown[] = [
      (xlsxNamespace as unknown as { default?: unknown }).default,
      (xlsxNamespace as unknown as { default?: { default?: unknown } }).default?.default,
      (xlsxNamespace as unknown as { VxeUIPluginExportXLSX?: unknown }).VxeUIPluginExportXLSX,
      xlsxNamespace,
    ];
    const plugin = (pluginCandidates.find(
      (candidate) => !!candidate && typeof (candidate as { install?: unknown }).install === 'function',
    ) ?? xlsxNamespace) as typeof VxeUIPluginExportXLSX;
    const handlers: Handlers = {};
    const interceptor = new Proxy(core.interceptor, {
      get(target, key) {
        if (key === 'mixin')
          return (entries: Handlers) => {
            Object.assign(handlers, entries);
          };
        return Reflect.get(target, key);
      },
    });
    const facade = new Proxy(core, {
      get(target, key) {
        return key === 'interceptor' ? interceptor : Reflect.get(target, key);
      },
    });
    plugin.install(facade, { ExcelJS });
    return handlers;
  });
  core.interceptor.mixin({
    'event.import': (params) => {
      if (params.options.type !== 'xlsx') return;
      return {
        status: false,
        result: loadHandlers().then((handlers) => {
          const handler = handlers['event.import'];
          if (typeof handler !== 'function') throw new Error('XLSX 插件初始化失败');
          const outcome = handler(params);
          return outcome && typeof outcome === 'object' ? outcome.result : outcome;
        }),
      };
    },
    'event.export': (params) => {
      if (params.options.type !== 'xlsx') return;
      return {
        status: false,
        result: loadHandlers().then((handlers) => {
          const handler = handlers['event.export'];
          if (typeof handler !== 'function') throw new Error('XLSX 插件初始化失败');
          const outcome = handler(params);
          return outcome && typeof outcome === 'object' ? outcome.result : outcome;
        }),
      };
    },
  });
}
