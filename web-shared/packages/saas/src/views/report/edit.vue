<script setup lang="ts">
/**
 * 报表设计器页（Univer）— 布局参考积木报表。
 * 布局：左侧数据集树（数据集 → 字段，可搜索）/ 中间 Univer 表格 / 右侧单元格属性面板。
 * 绑定语法（积木报表风格）：#{数据集名.字段} 单值；[[数据集名]] / [[/数据集名]] 列表块。
 * 模板定义：单元格属性面板支持 值编辑 / 类型（文本、数字、金额）/ 补充空白行（块开始标记格）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { useRoute } from 'vue-router';

import { LocaleType, createUniver, type FUniver, type IWorkbookData, type IRange } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import zhCN from '@univerjs/preset-sheets-core/locales/zh-CN';
import { CalculationMode } from '@univerjs/preset-sheets-core';
import '@univerjs/preset-sheets-core/lib/index.css';

import type ExcelJS from 'exceljs';
import { loadExcel } from '../../utils/load-excel';

import { Page } from '@vben/common-ui';
import { useSessionStore } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

import { NButton } from 'naive-ui';

import { buildContextParams, ensureProject } from './context';
import {
  AreaApi,
  DatasetApi,
  DatasourceApi,
  DeviceApi,
  DEVICE_FIXED_FIELDS,
  ReportApi,
  type DatasetInfo,
  type DatasourceInfo,
  type DeviceFieldSample,
  type DeviceRow,
} from './api';

// 宿主应用可通过 props 定制路由前缀（照告警样板），返回列表/保存后跳转使用
const props = withDefaults(defineProps<{ routePrefix?: string }>(), {
  routePrefix: '/iot/report',
});

// 平台上下文变量（企业/项目/区域名称），作为 #{token.name} 绑定，渲染时由参数注入
const CONTEXT_FIELDS: { token: string; label: string }[] = [
  { token: 'tenant', label: '企业名称' },
  { token: 'project', label: '项目名称' },
  { token: 'area', label: '区域名称' },
];

// ---------- 设计态初始模板（空 workbook，无演示数据） ----------

const EMPTY_WORKBOOK: IWorkbookData = {
  id: 'report',
  name: '报表',
  appVersion: '0.25.1',
  locale: LocaleType.ZH_CN,
  styles: {},
  sheetOrder: ['s1'],
  sheets: {
    s1: {
      id: 's1',
      name: '报表',
      rowCount: 50,
      columnCount: 10,
    },
  },
};

// 绑定格标记背景色（浅黄）
const BIND_BG = '#fff7d6';
// 块开始标记格背景色（浅蓝，与普通绑定格区分）
const BLOCK_BG = '#e8f1fe';

// ---------- 状态 ----------

const datasets = ref<DatasetInfo[]>([]);
const selectedDs = ref<DatasetInfo | null>(null); // 最近展开的数据集（绑定列表块用）
const expandedDs = ref<Set<string>>(new Set());
const fieldMap = ref<Map<string, { name: string; sample: string }[]>>(new Map());
// 数据源树（物联网数据源管理集成）：数据源 → 数据集 → 字段
const datasources = ref<DatasourceInfo[]>([]);
const expandedSources = ref<Set<string>>(new Set());
const dsBySource = ref<Map<string, DatasetInfo[]>>(new Map());
const searchText = ref('');
const loadingDs = ref(false);
const sessionStore = useSessionStore();
const projectStore = useProjectStore();
const previewing = ref(false);
const reportId = ref(''); // 当前报表 ID（路由参数）
// 区域树（物联网区域为树形结构）：按当前项目加载，用户选择后注入渲染
const areaOptions = ref<{ label: string; value: string; name: string }[]>([]);
const selectedAreaName = ref(''); // 选中的区域名称（区域树下拉，渲染时注入 #{area.name}）
const selectedAreaID = ref(''); // 选中的区域 ID（设备数据面板按此过滤设备）
const areaDevices = ref<DeviceRow[]>([]); // 选中区域下的设备列表
const deviceFields = ref<DeviceFieldSample[]>([]); // 设备固定字段 + 最新属性字段（含样例值）
const deviceLoading = ref(false);
const message = ref('');
const msgError = ref(false);
const warnings = ref<import('./api').RenderWarning[]>([]);

// 属性面板状态
const cellRef = ref('-'); // 坐标，如 A1
const cellValueText = ref(''); // 值（可编辑）
const cellType = ref('text'); // 类型：text/number/amount
const gapRows = ref(0); // 补充空白行（仅块开始标记格）
const isBlockStart = ref(false); // 当前单元格是否为块开始标记

let univerInstance: { dispose: () => void } | null = null;
let univerAPI: FUniver | null = null;
let previewUniver: { univer: { dispose: () => void }; univerAPI: FUniver } | null = null;
let selectionDisposable: { dispose: () => void } | null = null;
let dragDisposable: { dispose: () => void } | null = null;
// 当前选区（onSelectionChange 回调更新；null = 无选区）。必须用 ref 保证模板 :disabled 响应
const currentRange = ref<IRange | null>(null);

// 数据集树过滤后的字段（搜索框）
const filteredFields = computed(() => {
  const kw = searchText.value.trim();
  if (!kw) return fieldMap.value;
  const out = new Map<string, { name: string; sample: string }[]>();
  for (const [dsName, fields] of fieldMap.value.entries()) {
    const hit = fields.filter((f) => f.name.includes(kw) || f.sample.includes(kw));
    if (hit.length) out.set(dsName, hit);
  }
  return out;
});

// ---------- 生命周期 ----------

onMounted(async () => {
  // 按路由报表 ID 加载设计内容（无内容时用初始模板）
  const route = useRoute();
  reportId.value = String(route.params.id || '');
  if (reportId.value) {
    try {
      const detail = await ReportApi.detailGetOne(reportId.value);
      if (detail?.content) {
        try {
          initDesign(JSON.parse(detail.content) as IWorkbookData);
        } catch {
          initDesign(EMPTY_WORKBOOK);
          msgError.value = true;
          message.value = '报表内容解析失败，已载入空模板';
        }
      } else {
        initDesign(EMPTY_WORKBOOK);
      }
    } catch (e: any) {
      initDesign(EMPTY_WORKBOOK);
      msgError.value = true;
      message.value = `报表内容加载失败: ${e?.message || e}`;
    }
  } else {
    initDesign(EMPTY_WORKBOOK);
  }
  await loadDatasets();
  await loadDatasources();
  await loadAreaTree();
  // 初始选中 A1 展示属性面板
  refreshCellPanel();
});

// 保存报表设计内容到后端（detailUpdate）
async function onSave() {
  if (!univerAPI || !reportId.value) {
    msgError.value = true;
    message.value = '报表 ID 缺失，无法保存';
    return;
  }
  message.value = '保存中...';
  try {
    const wb = univerAPI.getActiveWorkbook();
    if (!wb) return;
    const snapshot = wb.save();
    await ReportApi.detailUpdate(reportId.value, JSON.stringify(snapshot));
    msgError.value = false;
    message.value = '保存成功';
  } catch (e: any) {
    msgError.value = true;
    message.value = `保存失败: ${e?.message || e}`;
  }
}

// 返回报表列表
function goBack() {
  window.location.hash = `#${props.routePrefix}`;
}

// 加载数据源列表（物联网数据源管理）
async function loadDatasources() {
  try {
    const resp = await DatasourceApi.list(1, 100);
    datasources.value = resp.list || [];
  } catch (e: any) {
    msgError.value = true;
    message.value = `数据源列表加载失败: ${e?.message || e}`;
  }
}

// 加载当前项目区域树（parentAreaID 层级，缩进展示）
async function loadAreaTree() {
  try {
    await ensureProject(projectStore);
    const pid = projectStore.currentProjectID;
    if (!pid) return;
    const resp = await AreaApi.list({
      page: { page: 1, size: 1000 },
      projectID: pid,
    });
    const all = resp.list || [];
    const byId = new Map<string, { areaID?: string; areaName?: string; parentAreaID?: string }>();
    for (const a of all) byId.set(String(a.areaID), a);
    // 构建树：父区域在前，子区域缩进
    const roots = all.filter((a) => !a.parentAreaID || String(a.parentAreaID) === '1' || !byId.has(String(a.parentAreaID)));
    const opts: { label: string; value: string; name: string }[] = [];
    const walk = (nodes: any[], depth: number) => {
      for (const n of nodes) {
        opts.push({ label: `${'　'.repeat(depth)}${n.areaName}`, value: String(n.areaID), name: n.areaName });
        const children = all.filter((a) => String(a.parentAreaID) === String(n.areaID));
        if (children.length) walk(children, depth + 1);
      }
    };
    walk(roots, 0);
    areaOptions.value = opts;
  } catch {
    // 区域树加载失败不阻断
  }
}

// 设备数据面板区域下拉变更：联动加载设备列表
function onDeviceAreaChange() {
  const opt = areaOptions.value.find((a) => a.value === selectedAreaID.value);
  if (!opt) {
    areaDevices.value = [];
    deviceFields.value = [];
    return;
  }
  void selectDeviceArea(opt.value, opt.name);
}

// 选中设备数据面板的区域节点：加载该区域设备列表 + 最新属性字段
async function selectDeviceArea(areaID: string, areaName: string) {
  selectedAreaID.value = areaID;
  selectedAreaName.value = areaName;
  deviceLoading.value = true;
  try {
    const resp = await DeviceApi.list({ areaID });
    const list = (resp.list ?? []) as DeviceRow[];
    areaDevices.value = list;
    // 字段：固定字段在前，最新属性字段（按设备 withProperties 的 dataID 去重）在后
    const fields: DeviceFieldSample[] = DEVICE_FIXED_FIELDS.map((f) => ({
      name: f,
      sample: sampleOfDeviceField(list, f),
    }));
    const seen = new Set<string>(DEVICE_FIXED_FIELDS);
    for (const d of list) {
      for (const [k, v] of Object.entries(d.withProperties ?? {})) {
        if (seen.has(k)) continue;
        seen.add(k);
        fields.push({ name: k, sample: v?.value ?? '' });
      }
    }
    deviceFields.value = fields;
    msgError.value = false;
    message.value = `区域「${areaName}」设备 ${list.length} 台`;
  } catch (e: any) {
    areaDevices.value = [];
    deviceFields.value = [];
    msgError.value = true;
    message.value = `设备列表加载失败: ${e?.message || e}`;
  } finally {
    deviceLoading.value = false;
  }
}

// 取某个设备字段的样例值（固定字段优先，属性字段取首台设备的值）
function sampleOfDeviceField(list: DeviceRow[], field: string): string {
  if (!list.length) return '';
  const d = list[0]!;
  if (field in d) return String((d as any)[field] ?? '');
  return d.withProperties?.[field]?.value ?? '';
}

// 绑定设备列表为列表块：选中区域 → 当前选区生成 [[devices]] ... [[/devices]]
function bindDeviceList() {
  if (!selectedAreaID.value) {
    msgError.value = true;
    message.value = '请先在「设备数据」面板选择区域';
    return;
  }
  if (!currentRange.value) {
    msgError.value = true;
    message.value = '请先在表格中选中多行作为列表块模板';
    return;
  }
  const { startRow, endRow, startColumn } = currentRange.value;
  if (endRow - startRow < 1) {
    msgError.value = true;
    message.value = '列表块需要至少 2 行';
    return;
  }
  updateCell(startRow, startColumn, { v: '[[devices]]' });
  markCell(startRow, startColumn, '[[devices]]');
  updateCell(endRow, startColumn, { v: '[[/devices]]' });
  markCell(endRow, startColumn, '[[/devices]]');
  msgError.value = false;
  message.value = '已绑定设备列表块（中间行可拖拽/点击绑定设备字段）';
}

// 绑定设备单值：当前单元格写入 #{devices.字段}
function bindDeviceSingle(field: string) {
  if (!univerAPI || !currentRange.value) {
    msgError.value = true;
    message.value = '请先在表格中选中一个单元格';
    return;
  }
  const { startRow, endRow, startColumn, endColumn } = currentRange.value;
  if (startRow !== endRow || startColumn !== endColumn) {
    msgError.value = true;
    message.value = '单值绑定需要一个单元格';
    return;
  }
  writeToken(startRow, startColumn, `#{devices.${field}}`, `已绑定设备字段: #{devices.${field}}`);
}

// 设备字段拖拽开始
function onDeviceFieldDragStart(e: DragEvent, field: string) {
  const payload: DragPayload = { type: 'report-field', dsName: 'devices', field };
  e.dataTransfer?.setData('text/plain', JSON.stringify(payload));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

// 展开/收起数据源，并加载其下数据集
async function toggleSource(ds: DatasourceInfo) {
  if (expandedSources.value.has(ds.id)) {
    expandedSources.value.delete(ds.id);
    expandedSources.value = new Set(expandedSources.value);
    return;
  }
  expandedSources.value.add(ds.id);
  expandedSources.value = new Set(expandedSources.value);
  if (!dsBySource.value.has(ds.id)) {
    try {
      const resp = await DatasetApi.list(1, 100, ds.id);
      dsBySource.value.set(ds.id, resp.list || []);
      dsBySource.value = new Map(dsBySource.value);
    } catch (e: any) {
      msgError.value = true;
      message.value = `数据源数据集加载失败: ${e?.message || e}`;
    }
  }
}

// 初始化（或导入后重建）设计实例：创建 Univer → 载入 workbook → 订阅选区/拖拽 → 绑定格标记
function initDesign(workbookData: IWorkbookData) {
  selectionDisposable?.dispose();
  dragDisposable?.dispose();
  univerInstance?.dispose();
  // 创建设计实例（Univer 官方 preset 快速开始用法；force 强制导入后公式自动计算）
  const { univer, univerAPI: api } = createUniver({
    locale: LocaleType.ZH_CN,
    locales: { [LocaleType.ZH_CN]: zhCN },
    presets: [
      UniverSheetsCorePreset({
        container: 'univer-container',
        formula: { initialFormulaComputing: CalculationMode.FORCED },
      }),
    ],
  });
  univerInstance = univer;
  univerAPI = api;
  api.createWorkbook(workbookData);

  // 订阅选区变化：记录选区并刷新右侧属性面板
  const wb = api.getActiveWorkbook();
  if (wb) {
    selectionDisposable = wb.onSelectionChange((selections) => {
      currentRange.value = selections.length > 0 ? selections[0] ?? null : null;
      refreshCellPanel();
    });
    // 拖拽绑定（积木报表风格）：左侧字段拖到表格单元格释放即绑定
    // Univer 自带 DragManagerService：坐标换算 + 拖拽目标高亮
    dragDisposable = wb.onDrop((cell) => {
      const payload = parseDragPayload(cell.dataTransfer);
      if (!payload) return;
      const { row, col } = cell.location;
      writeToken(row, col, `#{${payload.dsName}.${payload.field}}`, `已拖拽绑定: #{${payload.dsName}.${payload.field}}`);
    });
  }
  // 设计态标记：加载后扫描含绑定语法的单元格（单格失败不影响整体，容错处理）
  try {
    markBoundCells();
  } catch {
    // 个别单元格样式异常时跳过标记，不阻断设计器加载
  }
  // 强制计算 workbook 内公式（导入的 xlsx 公式无缓存值时立即计算）；
  // 需等 workbook 加载完成后再执行（立即调用公式引擎尚未注册完成）
  setTimeout(() => {
    try {
      api.getFormula()?.executeCalculation();
    } catch {
      // 公式引擎异常不阻断（公式为空时某些版本会抛错）
    }
  }, 500);
}

onBeforeUnmount(() => {
  selectionDisposable?.dispose();
  dragDisposable?.dispose();
  univerInstance?.dispose();
  previewUniver?.univer.dispose();
});

// ---------- 数据集树 ----------

async function loadDatasets() {
  try {
    const resp = await DatasetApi.list(1, 100, undefined, 'editor');
    datasets.value = resp.list || [];
  } catch (e: any) {
    msgError.value = true;
    message.value = `数据集列表加载失败: ${e?.message || e}`;
  }
}

function toggleDs(ds: DatasetInfo) {
  selectedDs.value = ds;
  if (expandedDs.value.has(ds.name)) {
    expandedDs.value.delete(ds.name);
  } else {
    expandedDs.value.add(ds.name);
  }
  expandedDs.value = new Set(expandedDs.value);
  void loadFields(ds);
}

async function loadFields(ds: DatasetInfo) {
  if (fieldMap.value.has(ds.name)) return;
  loadingDs.value = true;
  try {
    const resp = await DatasetApi.preview(ds.id);
    const rows = JSON.parse(resp.rows || '[]') as Record<string, any>[];
    const fieldNames = JSON.parse(resp.fields || '[]') as string[];
    const fields = fieldNames.map((name) => ({
      name,
      sample: rows.length > 0 ? String(rows[0]?.[name] ?? '') : '',
    }));
    fieldMap.value.set(ds.name, fields);
    fieldMap.value = new Map(fieldMap.value);
  } catch (e: any) {
    msgError.value = true;
    message.value = `数据集预览失败: ${e?.message || e}`;
  } finally {
    loadingDs.value = false;
  }
}

// ---------- 单元格属性面板 ----------

// 坐标格式化：行 0 基 → A1 风格
function cellRefLabel(row: number, col: number): string {
  let colLabel = '';
  let c = col;
  do {
    colLabel = String.fromCharCode(65 + (c % 26)) + colLabel;
    c = Math.floor(c / 26) - 1;
  } while (c >= 0);
  return `${colLabel}${row + 1}`;
}

// 从当前 workbook 快照读取单元格完整数据（v/s/custom）；
// 注意：save() 序列化后 cell.s 为样式 ID 字符串，需从 snapshot.styles 解析回样式对象
function readCellData(row: number, col: number): { v?: unknown; s?: Record<string, any>; custom?: Record<string, any> } {
  if (!univerAPI) return {};
  const wb = univerAPI.getActiveWorkbook();
  if (!wb) return {};
  const snapshot = wb.save();
  const sheetData = snapshot.sheets?.[snapshot.sheetOrder?.[0] ?? ''];
  const cellData = sheetData?.cellData as Record<string, Record<string, any>> | undefined;
  const cell = cellData?.[String(row)]?.[String(col)];
  if (!cell) return {};
  // save() 序列化后 cell.s 为样式 ID 字符串（或内联样式对象），从 snapshot.styles 解析回样式对象
  let s: Record<string, any> | undefined;
  if (typeof cell.s === 'string' && snapshot.styles) {
    s = (snapshot.styles as Record<string, any>)[cell.s] as Record<string, any> | undefined;
  } else if (cell.s && typeof cell.s === 'object') {
    s = cell.s as Record<string, any>;
  }
  return { v: cell.v, s, custom: cell.custom as Record<string, any> | undefined };
}

// 合并更新当前单元格（保留 v/s/custom 其他字段）
function updateCell(row: number, col: number, patch: { v?: unknown; s?: Record<string, any>; custom?: Record<string, any> }) {
  if (!univerAPI) return;
  const wb = univerAPI.getActiveWorkbook();
  const sheet = wb?.getActiveSheet();
  if (!wb || !sheet) return;
  const cur = readCellData(row, col);
  const next: Record<string, any> = {};
  if (patch.v !== undefined) next.v = patch.v;
  else if (cur.v !== undefined) next.v = cur.v;
  if (patch.s !== undefined || cur.s !== undefined) {
    next.s = { ...(cur.s || {}), ...(patch.s || {}) };
  }
  if (patch.custom !== undefined || cur.custom !== undefined) {
    next.custom = { ...(cur.custom || {}), ...(patch.custom || {}) };
  }
  sheet.getRange(row, col).setValue(next as any);
}

// 刷新属性面板：读取当前单元格的值/类型/补充空白行
function refreshCellPanel() {
  const range = currentRange.value;
  if (!univerAPI || !range) {
    cellRef.value = '-';
    cellValueText.value = '';
    cellType.value = 'text';
    gapRows.value = 0;
    isBlockStart.value = false;
    return;
  }
  const { startRow, startColumn } = range;
  cellRef.value = cellRefLabel(startRow, startColumn);
  const data = readCellData(startRow, startColumn);
  cellValueText.value = typeof data.v === 'string' ? data.v : data.v == null ? '' : String(data.v);
  // 类型推断：按数字格式 pattern
  const pattern = data.s?.n?.pattern;
  if (pattern === '#,##0') cellType.value = 'number';
  else if (pattern === '#,##0.00') cellType.value = 'amount';
  else cellType.value = 'text';
  // 补充空白行：块开始标记格才可配置
  const trimmed = typeof data.v === 'string' ? data.v.trim() : '';
  isBlockStart.value = /^\[\[[^/]/.test(trimmed);
  gapRows.value = isBlockStart.value
    ? Number((data.custom as any)?.report?.gapRows ?? 0)
    : 0;
}

// 值编辑：写回单元格
function applyCellValue() {
  const range = currentRange.value;
  if (!univerAPI || !range) return;
  const { startRow, startColumn } = range;
  const v = cellValueText.value;
  updateCell(startRow, startColumn, { v });
  markCell(startRow, startColumn, v);
  msgError.value = false;
  message.value = `已更新 ${cellRef.value} 的值`;
}

// 类型编辑：数字/金额设置格式 pattern，文本清除 pattern
function applyCellType() {
  const range = currentRange.value;
  if (!univerAPI || !range) return;
  const { startRow, startColumn } = range;
  const s: Record<string, any> = {};
  if (cellType.value === 'number') s.n = { pattern: '#,##0' };
  else if (cellType.value === 'amount') s.n = { pattern: '#,##0.00' };
  else s.n = null;
  updateCell(startRow, startColumn, { s });
  msgError.value = false;
  message.value = `已设置 ${cellRef.value} 类型`;
}

// 补充空白行：写入开始标记格的 custom.report.gapRows
function applyGapRows() {
  const range = currentRange.value;
  if (!univerAPI || !range || !isBlockStart.value) return;
  const { startRow, startColumn } = range;
  const n = Math.max(0, Math.floor(Number(gapRows.value) || 0));
  updateCell(startRow, startColumn, {
    custom: { report: { ...((readCellData(startRow, startColumn).custom as any)?.report || {}), gapRows: n } },
  });
  msgError.value = false;
  message.value = `补充空白行已设为 ${n}`;
}

// ---------- 绑定交互（积木报表风格：拖拽 / 点击写入 #{数据集名.字段}） ----------

// 拖拽负载：dataTransfer.text/plain 携带 JSON
interface DragPayload {
  type: 'report-field';
  dsName: string;
  field: string;
}

// 字段拖拽开始：写入 dataTransfer 供 onDrop 读取
function onFieldDragStart(e: DragEvent, ds: DatasetInfo, field: string) {
  const payload: DragPayload = { type: 'report-field', dsName: ds.name, field };
  e.dataTransfer?.setData('text/plain', JSON.stringify(payload));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

// 解析拖拽负载；非本设计器字段返回 null
function parseDragPayload(dt: DataTransfer): DragPayload | null {
  if (!dt) return null;
  const raw = dt.getData('text/plain');
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as DragPayload;
    if (payload?.type === 'report-field' && payload.dsName && payload.field) return payload;
  } catch {
    // 非 JSON（如外部文本）忽略
  }
  return null;
}

// 写入绑定 token 到指定单元格（含块标记保护）
function writeToken(row: number, col: number, token: string, okMsg: string): boolean {
  if (!univerAPI) return false;
  const wb = univerAPI.getActiveWorkbook();
  const sheet = wb?.getActiveSheet();
  if (!wb || !sheet) return false;
  const cur = sheet.getRange(row, col).getValue();
  if (typeof cur === 'string') {
    const trimmed = cur.trim();
    if (trimmed.startsWith('[[')) {
      msgError.value = true;
      message.value = `该单元格是列表块标记（${trimmed}）。请把字段绑定到标记之间的行（或相邻列），渲染时按数据行数展开`;
      return false;
    }
  }
  updateCell(row, col, { v: token });
  markCell(row, col, token);
  msgError.value = false;
  message.value = okMsg;
  return true;
}

// ---------- 设计态绑定格标记（浅黄）与块标记格（浅蓝） ----------

// 标记单个绑定格：v 以 [[ 开头视为块标记（浅蓝），否则普通绑定格（浅黄）
function markCell(row: number, col: number, v: unknown) {
  if (!univerAPI) return;
  const text = typeof v === 'string' ? v : '';
  const isBlock = /^\[\[/.test(text.trim());
  updateCell(row, col, {
    s: { bg: { rgb: isBlock ? BLOCK_BG.replace('#', '') : BIND_BG.replace('#', '') } },
  });
}

// 扫描 workbook 全部单元格：含绑定语法（#{ / ${ / [[）且无背景色的格补标记
function markBoundCells() {
  if (!univerAPI) return;
  const wb = univerAPI.getActiveWorkbook();
  if (!wb) return;
  const snapshot = wb.save();
  const sheetData = snapshot.sheets?.[snapshot.sheetOrder?.[0] ?? ''];
  const cellData = sheetData?.cellData as Record<string, Record<string, any>> | undefined;
  if (!cellData) return;
  for (const [rowKey, cols] of Object.entries(cellData)) {
    for (const [colKey, cell] of Object.entries(cols)) {
      const v = cell?.v;
      if (typeof v !== 'string') continue;
      const trimmed = v.trim();
      if (!/^(#\{|\$\{|\[\[)/.test(trimmed)) continue;
      // 已有背景色的格不覆盖（用户自定义样式优先）
      const s = cell.s;
      const hasBg =
        (typeof s === 'object' && (s as any)?.bg) ||
        (typeof s === 'string' && (snapshot.styles as Record<string, any>)?.[s]?.bg);
      if (hasBg) continue;
      markCell(Number(rowKey), Number(colKey), v);
    }
  }
}

// 绑定为列表块：当前选区首行最左列写 [[数据集名]]，末行最左列写 [[/数据集名]]
// 保护：首行/末行已有 [[ 标记时拒绝，避免覆盖已有块
function bindList(ds: DatasetInfo) {
  if (!univerAPI) return;
  if (!currentRange.value) {
    msgError.value = true;
    message.value = '请先在表格中选中多行（列表块模板），再点击「绑定为列表」';
    return;
  }
  const { startRow, endRow, startColumn } = currentRange.value;
  if (endRow - startRow < 1) {
    msgError.value = true;
    message.value = '列表块需要至少 2 行（首行开始标记 + 末行结束标记），请多选几行后重试';
    return;
  }
  const wb = univerAPI.getActiveWorkbook();
  const sheet = wb?.getActiveSheet();
  if (!wb || !sheet) return;
  const headCur = sheet.getRange(startRow, startColumn).getValue();
  const tailCur = sheet.getRange(endRow, startColumn).getValue();
  const headText = typeof headCur === 'string' ? headCur.trim() : '';
  const tailText = typeof tailCur === 'string' ? tailCur.trim() : '';
  if (headText.startsWith('[[') || tailText.startsWith('[[')) {
    msgError.value = true;
    message.value = '首行或末行已是列表块标记，请选择其他行作为列表块模板';
    return;
  }
  updateCell(startRow, startColumn, { v: `[[${ds.name}]]` });
  markCell(startRow, startColumn, `[[${ds.name}]]`);
  updateCell(endRow, startColumn, { v: `[[/${ds.name}]]` });
  markCell(endRow, startColumn, `[[/${ds.name}]]`);
  msgError.value = false;
  message.value = `已绑定为列表块：[[${ds.name}]] ... [[/${ds.name}]]（中间行写字段绑定）`;
}

// ---------- 数据集动态参数（预览/导出前收集，数据结构照 bigscreen DynamicParamsBuilder） ----------

// 动态参数定义：{ name: { label, type, default, options?, required? } }，type ∈ boolean|date|number|select|text
interface DynamicParamDef {
  label: string;
  type: 'boolean' | 'date' | 'number' | 'select' | 'text';
  default?: string | number | boolean;
  options?: string[] | { label: string; value: string }[];
  required?: boolean;
}

// 收集 workbook 中引用的数据集 token（与后端 render/export 同一正则：
// 单值 [#$]{token.字段} 与块开始标记 [[token]]），排除平台上下文 token
function collectDatasetTokens(): string[] {
  const wb = univerAPI?.getActiveWorkbook();
  if (!wb) return [];
  const snapshot = wb.save();
  const sheetData = snapshot.sheets?.[snapshot.sheetOrder?.[0] ?? ''];
  const cellData = sheetData?.cellData as Record<string, Record<string, any>> | undefined;
  if (!cellData) return [];
  const tokens = new Set<string>();
  const singleRefRe = /[#$]\{([\p{L}\p{N}_]+)\./gu;
  const blockStartRe = /^\[\[([\p{L}\p{N}_]+)\]\]$/u;
  for (const cols of Object.values(cellData)) {
    for (const cell of Object.values(cols)) {
      const v = cell?.v;
      if (typeof v !== 'string') continue;
      const trimmed = v.trim();
      const bm = trimmed.match(blockStartRe);
      if (bm?.[1]) {
        tokens.add(bm[1]);
        continue;
      }
      for (const m of trimmed.matchAll(singleRefRe)) if (m[1]) tokens.add(m[1]);
    }
  }
  // 排除平台上下文变量（企业/项目/区域名称）与设备列表内置数据源
  for (const cf of CONTEXT_FIELDS) tokens.delete(cf.token);
  tokens.delete('devices');
  return [...tokens];
}

// 读取数据集 dynamicParams 配置：ds_<id> token 走 get-one；名称 token 走 get-list 匹配
async function fetchDynamicParams(token: string): Promise<Record<string, DynamicParamDef> | null> {
  try {
    let info: DatasetInfo | null = null;
    if (/^ds_\d+$/.test(token)) {
      info = await DatasetApi.getOne(token.replace(/^ds_/, ''));
    } else {
      const resp = await DatasetApi.list(1, 1000);
      info = (resp.list || []).find((d) => d.name === token) || null;
    }
    if (!info?.dynamicParams) return null;
    const parsed = JSON.parse(info.dynamicParams) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, DynamicParamDef>;
    }
  } catch {
    // 参数读取失败不阻断（按无参数处理）
  }
  return null;
}

// 动态参数表单状态（原生 div 弹层，与列表页/设计器原生风格一致）
const paramDialogVisible = ref(false);
const paramFields = ref<{ name: string; def: DynamicParamDef }[]>([]);
const paramValues = ref<Record<string, string>>({});
let paramResolver: ((v: Record<string, string> | null) => void) | null = null;

// options 归一化：字符串数组或 {label,value} 数组 → {label,value}[]
function normalizeOptions(options?: DynamicParamDef['options']): { label: string; value: string }[] {
  if (!options) return [];
  return options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : { label: String(o.label), value: String(o.value) },
  );
}

// 布尔参数 checkbox 变更
function onBooleanParamChange(name: string, e: Event) {
  paramValues.value[name] = (e.target as HTMLInputElement).checked ? 'true' : 'false';
}

function confirmParamDialog() {
  paramDialogVisible.value = false;
  paramResolver?.(paramValues.value);
  paramResolver = null;
}

function cancelParamDialog() {
  paramDialogVisible.value = false;
  paramResolver?.(null);
  paramResolver = null;
}

// 组装渲染/导出参数：先取平台上下文参数（企业/项目/区域名称），
// 再收集各数据集 dynamicParams 弹表单填值；数据集参数同名时覆盖上下文参数。
// 返回 null 表示用户取消了参数表单（调用方应中止预览/导出）。
async function buildReportParams(): Promise<Record<string, string> | null> {
  const params = await buildContextParams(sessionStore, projectStore, selectedAreaName.value);
  // 设备数据面板选中区域 → 注入设备过滤参数（渲染 [[devices]] 列表块时使用）
  if (selectedAreaID.value) {
    params.deviceAreaID = selectedAreaID.value;
  }
  const tokens = collectDatasetTokens();
  const defs: { name: string; def: DynamicParamDef }[] = [];
  for (const token of tokens) {
    const dynamicParams = await fetchDynamicParams(token);
    if (!dynamicParams) continue;
    for (const [name, def] of Object.entries(dynamicParams)) {
      defs.push({ name, def: def as DynamicParamDef });
    }
  }
  if (!defs.length) return params;
  const values = await new Promise<Record<string, string> | null>((resolve) => {
    paramResolver = resolve;
    paramFields.value = defs;
    paramValues.value = {};
    for (const { name, def } of defs) {
      const d = def.default;
      paramValues.value[name] = d === undefined || d === null ? '' : String(d);
    }
    paramDialogVisible.value = true;
  });
  if (!values) return null;
  return { ...params, ...values };
}

// 绑定单值：当前单元格写入 #{数据集名.字段}（点击字段按钮）
function bindSingle(ds: DatasetInfo, field: string) {
  if (!univerAPI) return;
  if (!currentRange.value) {
    msgError.value = true;
    message.value = '请先在表格中选中一个单元格（或直接把字段拖拽到目标单元格）';
    return;
  }
  const { startRow, startColumn, endRow, endColumn } = currentRange.value;
  if (startRow !== endRow || startColumn !== endColumn) {
    msgError.value = true;
    message.value = '单值绑定需要一个单元格，请单选后重试';
    return;
  }
  writeToken(startRow, startColumn, `#{${ds.name}.${field}}`, `已绑定: #{${ds.name}.${field}}`);
}

// 绑定上下文变量（企业/项目/区域名称）：#{token.name}
function bindContext(cf: { token: string; label: string }) {
  if (!univerAPI) return;
  if (!currentRange.value) {
    msgError.value = true;
    message.value = '请先在表格中选中一个单元格（或直接把字段拖拽到目标单元格）';
    return;
  }
  const { startRow, startColumn, endRow, endColumn } = currentRange.value;
  if (startRow !== endRow || startColumn !== endColumn) {
    msgError.value = true;
    message.value = '单值绑定需要一个单元格，请单选后重试';
    return;
  }
  writeToken(startRow, startColumn, `#{${cf.token}.name}`, `已绑定: ${cf.label}（#{${cf.token}.name}）`);
}

// 上下文变量拖拽开始
function onContextDragStart(e: DragEvent, cf: { token: string; label: string }) {
  const payload: DragPayload = { type: 'report-field', dsName: cf.token, field: 'name' };
  e.dataTransfer?.setData('text/plain', JSON.stringify(payload));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

// ---------- 导出 / 导入 xlsx ----------

// 导出：调后端 export 接口（同一渲染引擎）→ 打开受控下载地址
async function onExport() {
  if (!univerAPI) return;
  message.value = '导出中...';
  try {
    const wb = univerAPI.getActiveWorkbook();
    if (!wb) return;
    const snapshot = wb.save();
    const params = await buildReportParams();
    if (!params) return; // 用户取消数据集参数表单
    const resp = await ReportApi.exportXlsx(JSON.stringify(snapshot), params);
    msgError.value = false;
    message.value = '导出成功，正在打开下载...';
    window.open(resp.url, '_blank');
  } catch (e: any) {
    msgError.value = true;
    message.value = `导出失败: ${e?.message || e}`;
  }
}

// 导入：exceljs 解析 .xlsx → Univer workbook JSON → 重建设计实例
async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  message.value = '导入中...';
  try {
    const buf = await file.arrayBuffer();
    // 文件选定后再加载 ExcelJS，不阻塞报表设计器初始化。
    const ExcelJS = await loadExcel();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const data = xlsxToWorkbookData(wb);
    initDesign(data);
    msgError.value = false;
    message.value = `导入成功：${wb.worksheets.length} 个工作表`;
  } catch (err: any) {
    msgError.value = true;
    message.value = `导入失败: ${err?.message || err}`;
  }
}

// xlsx workbook → Univer IWorkbookData（值/样式/行高列宽/合并）
function xlsxToWorkbookData(wb: ExcelJS.Workbook): IWorkbookData {
  const sheetOrder: string[] = [];
  const sheets: Record<string, any> = {};
  wb.eachSheet((ws, id) => {
    const sheetId = `s${id}`;
    sheetOrder.push(sheetId);
    const cellData: Record<string, any> = {};
    const rowData: Record<string, any> = {};
    const columnData: Record<string, any> = {};
    const merges: any[] = [];
    ws.eachRow((row, rowNumber) => {
      if (row.height) rowData[String(rowNumber - 1)] = { h: row.height };
      row.eachCell((cell, colNumber) => {
        const raw = cell.value;
        if (raw === null || raw === undefined) return;
        let val: any = raw;
        let formula = '';
        if (typeof raw === 'object' && (raw as any).formula) {
          // 公式单元格：f 存公式，v 存计算值（result 可能缺失）
          formula = String((raw as any).formula);
          val = (raw as any).result ?? '';
        } else if (typeof raw === 'object' && (raw as any).richText) {
          val = (raw as any).richText.map((t: any) => t.text ?? '').join('');
        } else if (raw instanceof Date) {
          val = raw.toISOString().slice(0, 10);
        } else if (typeof raw === 'object' && (raw as any).result !== undefined) {
          val = (raw as any).result; // 其他带计算结果的对象
        } else if (typeof raw === 'object' && (raw as any).text !== undefined) {
          val = (raw as any).text; // 超链接等富文本
        }
        if (val === null || val === undefined) return;
        const cellObj: any = { v: val };
        // Univer 公式 f 字段需要 "=" 前缀（如 "=SUM(A1:A2)"）
        if (formula) cellObj.f = formula.startsWith('=') ? formula : `=${formula}`;
        // 样式：加粗 / 背景 / 数字格式
        const style: any = {};
        if (cell.font?.bold) style.font = { b: true };
        const fill = cell.fill as { fgColor?: { argb?: string } } | null | undefined;
        const argb = fill?.fgColor?.argb;
        if (argb && argb.length === 8) style.bg = { rgb: argb.slice(2) };
        const numFmt = cell.numFmt;
        if (numFmt && numFmt !== 'General' && typeof val === 'number') style.n = { pattern: numFmt };
        if (Object.keys(style).length) cellObj.s = style;
        const rowKey = String(rowNumber - 1);
        if (!cellData[rowKey]) cellData[rowKey] = {};
        cellData[rowKey][String(colNumber - 1)] = cellObj;
      });
    });
    ws.columns?.forEach((col, idx) => {
      if (col.width) columnData[String(idx)] = { w: col.width * 7 };
    });
    (ws.model as any).merges?.forEach((m: any) => {
      merges.push({ startRow: m.top - 1, endRow: m.bottom - 1, startColumn: m.left - 1, endColumn: m.right - 1 });
    });
    sheets[sheetId] = {
      id: sheetId,
      name: ws.name,
      cellData,
      rowData,
      columnData,
      merges,
      rowCount: ws.rowCount || 50,
      columnCount: ws.columnCount || 10,
    };
  });
  return { id: 'report-import', sheetOrder, sheets } as IWorkbookData;
}

// ---------- 预览 ----------

async function onPreview() {
  if (!univerAPI) return;
  warnings.value = [];
  message.value = '渲染中...';
  try {
    const wb = univerAPI.getActiveWorkbook();
    if (!wb) return;
    const snapshot = wb.save();
    const params = await buildReportParams();
    if (!params) return; // 用户取消数据集参数表单
    const resp = await ReportApi.render(JSON.stringify(snapshot), params);
    warnings.value = resp.warnings || [];
    showPreview(resp.content);
    msgError.value = false;
    message.value = `渲染完成${warnings.value.length ? `（${warnings.value.length} 条告警）` : ''}`;
  } catch (e: any) {
    msgError.value = true;
    message.value = `渲染失败: ${e?.message || e}`;
  }
}

// 新建只读预览实例：新 div 覆盖设计实例，setEditable(false) 取消编辑态 + CSS pointer-events:none 禁交互
async function showPreview(content: string) {
  previewing.value = true;
  // 等 Vue 渲染出预览容器（nextTick 保证 DOM 就绪，替代固定延时避免容器未挂载导致预览空白）
  await nextTick();
  const container = document.getElementById('univer-preview-container');
  if (!container) {
    msgError.value = true;
    message.value = '预览容器创建失败，请重试';
    previewing.value = false;
    return;
  }
  try {
    previewUniver = createUniver({
      locale: LocaleType.ZH_CN,
      locales: { [LocaleType.ZH_CN]: zhCN },
      presets: [
        UniverSheetsCorePreset({
          container: 'univer-preview-container',
          formula: { initialFormulaComputing: CalculationMode.FORCED },
        }),
      ],
    });
    // 只读预览：禁止编辑（FWorkbook.setEditable(false)，取消编辑态）
    previewUniver.univerAPI.getActiveWorkbook()?.setEditable(false);
    let data: IWorkbookData;
    try {
      data = JSON.parse(content);
    } catch {
      msgError.value = true;
      message.value = '渲染结果解析失败';
      previewing.value = false;
      return;
    }
    previewUniver.univerAPI.createWorkbook(data);
  } catch (e: any) {
    msgError.value = true;
    message.value = `预览实例创建失败: ${e?.message || e}`;
    previewUniver = null;
    previewing.value = false;
  }
}

function exitPreview() {
  previewUniver?.univer.dispose();
  previewUniver = null;
  previewing.value = false;
}
</script>

<template>
  <Page title="" auto-content-height>
    <div class="report-editor">
      <div class="toolbar">
        <span class="title">报表设计器</span>
        <span class="msg" :class="{ error: msgError }">{{ message }}</span>
        <select
          v-if="!previewing && areaOptions.length"
          v-model="selectedAreaName"
          class="area-select"
          title="选择区域（树形），渲染时注入 #{{ '{' }}area.name{{ '}' }}"
        >
          <option value="">区域：默认（项目首个）</option>
          <option v-for="a in areaOptions" :key="a.value" :value="a.name">{{ a.label }}</option>
        </select>
        <NButton v-if="!previewing" class="ml-auto" @click="goBack">← 返回列表</NButton>
        <NButton v-if="!previewing" type="primary" @click="onSave">保存</NButton>
        <NButton v-if="!previewing" @click="onExport">导出 xlsx</NButton>
        <label v-if="!previewing" class="file-btn">
          <NButton>导入 xlsx</NButton>
          <input type="file" accept=".xlsx" class="file-input" @change="onImportFile" />
        </label>
        <NButton v-if="!previewing" type="primary" @click="onPreview">预览</NButton>
        <NButton v-if="previewing" class="ml-auto" @click="exitPreview">退出预览</NButton>
      </div>
      <div class="body">
        <!-- 左侧：数据源树 + 数据集 + 上下文 -->
        <div class="left-panel">
          <h4>数据源（物联网）</h4>
          <div class="tree">
            <div v-for="ds in datasources" :key="ds.id" class="ds-node">
              <div class="ds-head" @click="toggleSource(ds)">
                <span class="arrow">{{ expandedSources.has(ds.id) ? '▼' : '▶' }}</span>
                <span class="ds-name">{{ ds.name }}</span>
                <span class="ds-type">{{ ds.type }}</span>
              </div>
              <div v-if="expandedSources.has(ds.id)" class="ds-fields">
                <div
                  v-for="d in (dsBySource.get(ds.id) || [])"
                  :key="d.id"
                  class="sub-ds"
                  :class="{ active: selectedDs?.id === d.id }"
                  @click="toggleDs(d)"
                >
                  <span class="arrow">{{ expandedDs.has(d.name) ? '▼' : '▶' }}</span>
                  <span class="ds-name">{{ d.name }}</span>
                  <div v-if="expandedDs.has(d.name)" class="ds-fields">
                    <button
                      v-for="f in (filteredFields.get(d.name) || [])"
                      :key="f.name"
                      class="field-item"
                      :class="{ dim: !currentRange }"
                      draggable="true"
                      :title="`拖拽到单元格绑定，或点击绑定到当前选中单元格`"
                      @click="bindSingle(d, f.name)"
                      @dragstart="onFieldDragStart($event, d, f.name)"
                    >
                      <span class="f-name">{{ f.name }}</span>
                      <span class="f-sample">{{ f.sample }}</span>
                    </button>
                    <div v-if="!fieldMap.has(d.name) && !loadingDs" class="empty">点击加载字段</div>
                  </div>
                </div>
                <div v-if="!(dsBySource.get(ds.id) || []).length" class="empty">
                  该数据源下暂无数据集
                </div>
              </div>
            </div>
            <div v-if="!datasources.length" class="empty">暂无数据源</div>
          </div>

        <h4>数据集管理</h4>
        <input v-model="searchText" class="search" placeholder="搜索字段" />
        <div class="tree">
          <div v-for="ds in datasets" :key="ds.id" class="ds-node">
            <div class="ds-head" @click="toggleDs(ds)">
              <span class="arrow">{{ expandedDs.has(ds.name) ? '▼' : '▶' }}</span>
              <span class="ds-name">{{ ds.name }}</span>
              <span class="ds-type">{{ ds.type }}</span>
            </div>
            <div v-if="expandedDs.has(ds.name)" class="ds-fields">
              <div v-if="loadingDs && !fieldMap.has(ds.name)" class="empty">加载中...</div>
              <button
                v-for="f in (filteredFields.get(ds.name) || [])"
                :key="f.name"
                class="field-item"
                :class="{ dim: !currentRange }"
                draggable="true"
                :title="`拖拽到单元格绑定，或点击绑定到当前选中单元格`"
                @click="bindSingle(ds, f.name)"
                @dragstart="onFieldDragStart($event, ds, f.name)"
              >
                <span class="f-name">{{ f.name }}</span>
                <span class="f-sample">{{ f.sample }}</span>
              </button>
              <div v-if="fieldMap.has(ds.name) && !(filteredFields.get(ds.name) || []).length" class="empty">
                无匹配字段
              </div>
            </div>
          </div>
          <div v-if="!datasets.length" class="empty">暂无数据集</div>
        </div>
        <NButton
          v-if="selectedDs"
          class="bind-list"
          :disabled="!currentRange"
          @click="bindList(selectedDs)"
        >
          绑定为列表（选中 ≥2 行）
        </NButton>

        <h4>设备数据</h4>
        <select v-model="selectedAreaID" class="search" title="选择区域" @change="onDeviceAreaChange">
          <option value="">选择区域（区域树）</option>
          <option v-for="a in areaOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
        </select>
        <div v-if="deviceLoading" class="empty">设备加载中...</div>
        <div v-else-if="areaDevices.length" class="ds-fields">
          <button
            v-for="f in deviceFields"
            :key="f.name"
            class="field-item"
            :class="{ dim: !currentRange }"
            draggable="true"
            :title="`拖拽到单元格绑定，或点击绑定到当前选中单元格`"
            @click="bindDeviceSingle(f.name)"
            @dragstart="onDeviceFieldDragStart($event, f.name)"
          >
            <span class="f-name">{{ f.name }}</span>
            <span class="f-sample">{{ f.sample }}</span>
          </button>
        </div>
        <div v-else-if="selectedAreaID" class="empty">该区域暂无设备</div>
        <NButton
          v-if="selectedAreaID"
          class="bind-list"
          :disabled="!currentRange"
          @click="bindDeviceList"
        >
          绑定设备列表（选中 ≥2 行）
        </NButton>

        <h4>上下文</h4>
        <div class="ds-fields ctx-fields">
          <button
            v-for="cf in CONTEXT_FIELDS"
            :key="cf.token"
            class="field-item"
            :class="{ dim: !currentRange }"
            draggable="true"
            :title="`绑定 ${cf.label}：拖拽或点击`"
            @click="bindContext(cf)"
            @dragstart="onContextDragStart($event, cf)"
          >
            <span class="f-name">{{ cf.label }}</span>
            <span class="f-sample">#{{ '{' }}{{ cf.token }}.name{{ '}' }}</span>
          </button>
        </div>

        <div class="tip">
          ① 拖拽字段/上下文到单元格绑定；② 选中多行 → 绑定为列表；③ 属性面板可编辑值/类型/补充空白行
        </div>
      </div>

      <!-- 中间：表格 -->
      <div class="sheet-area">
        <div id="univer-container" class="univer-box" />
        <div
          v-if="previewing"
          id="univer-preview-container"
          class="univer-box preview-overlay"
        />
        <div v-if="warnings.length" class="warnings">
          <div v-for="(w, i) in warnings" :key="i" class="warning">
            [{{ w.sheetName }} {{ w.row + 1 }}:{{ w.col + 1 }}] {{ w.token }} → {{ w.reason }}
          </div>
        </div>
      </div>

      <!-- 右侧：单元格属性 -->
      <div class="right-panel">
        <h4>单元格</h4>
        <div class="prop-row">
          <label>坐标</label>
          <input :value="cellRef" readonly class="readonly" />
        </div>
        <div class="prop-row">
          <label>值</label>
          <input v-model="cellValueText" @change="applyCellValue" placeholder="单元格值或 #{数据集.字段}" />
        </div>
        <div class="prop-row">
          <label>类型</label>
          <select v-model="cellType" @change="applyCellType">
            <option value="text">文本</option>
            <option value="number">数字</option>
            <option value="amount">金额</option>
          </select>
        </div>
        <div v-if="isBlockStart" class="prop-row">
          <label>补充空白行</label>
          <input v-model.number="gapRows" type="number" min="0" @change="applyGapRows" />
        </div>
        <div class="prop-tip">
          <template v-if="isBlockStart">
            当前是列表块开始标记，设置「补充空白行」后，渲染时每行数据之间插入对应数量的空行。
          </template>
          <template v-else>
            选中单元格后可编辑值/类型；选中列表块开始标记格可设置补充空白行。
          </template>
        </div>
      </div>
    </div>

    <!-- 数据集动态参数弹窗（预览/导出前收集） -->
    <div v-if="paramDialogVisible" class="param-mask" @click.self="cancelParamDialog">
      <div class="param-dialog">
        <h4>数据集动态参数</h4>
        <div class="param-tip">以下数据集配置了动态参数，填写后用于本次渲染/导出。</div>
        <div v-for="p in paramFields" :key="p.name" class="param-row">
          <label>{{ p.def.label || p.name }}<span v-if="p.def.required" class="req"> *</span></label>
          <input v-if="p.def.type === 'text'" v-model="paramValues[p.name]" placeholder="请输入" />
          <input
            v-else-if="p.def.type === 'number'"
            v-model="paramValues[p.name]"
            type="number"
            placeholder="请输入数字"
          />
          <input v-else-if="p.def.type === 'date'" v-model="paramValues[p.name]" type="date" />
          <select v-else-if="p.def.type === 'select'" v-model="paramValues[p.name]">
            <option value="">请选择</option>
            <option v-for="(o, i) in normalizeOptions(p.def.options)" :key="i" :value="o.value">
              {{ o.label }}
            </option>
          </select>
          <input
            v-else-if="p.def.type === 'boolean'"
            type="checkbox"
            :checked="paramValues[p.name] === 'true'"
            @change="onBooleanParamChange(p.name, $event)"
          />
        </div>
        <div class="param-actions">
          <NButton @click="cancelParamDialog">取消</NButton>
          <NButton type="primary" @click="confirmParamDialog">确定</NButton>
        </div>
      </div>
    </div>
    </div>
  </Page>
</template>

<style scoped>
.report-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #eee;
}
.title {
  font-weight: 600;
  white-space: nowrap;
}
.msg {
  flex: 1;
  color: #666;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg.error {
  color: #d03050;
  font-weight: 600;
}
.file-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.file-input {
  display: none;
}
.area-select {
  max-width: 220px;
  padding: 4px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
}
.body {
  display: flex;
  flex: 1;
  min-height: 0;
}
/* 左侧数据集树 */
.left-panel {
  width: 260px;
  border-right: 1px solid #eee;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fafafa;
  overflow: auto;
}
.left-panel h4,
.right-panel h4 {
  margin: 4px 0;
  font-size: 13px;
}
.search {
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
}
.tree {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: #fff;
}
.ds-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}
.ds-head:hover {
  background: #f5f8ff;
}
.arrow {
  color: #999;
  font-size: 10px;
}
.ds-type {
  color: #999;
  font-size: 11px;
  font-weight: 400;
}
.ds-fields {
  border-bottom: 1px solid #f0f0f0;
}
.sub-ds {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  font-size: 12px;
}
.sub-ds:hover {
  background: #f5f8ff;
}
.sub-ds.active {
  background: #e8f1fe;
}
.ctx-fields {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: #fff;
}
.field-item {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 5px 10px 5px 22px;
  border: none;
  border-bottom: 1px solid #f5f5f5;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
}
.field-item:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.field-item.dim {
  opacity: 0.6;
}
.field-item:hover:not(.dim) {
  background: #f0f6ff;
}
.f-name {
  font-weight: 500;
}
.f-sample {
  color: #999;
  font-size: 11px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bind-list {
  padding: 6px 10px;
}
.empty {
  color: #aaa;
  font-size: 12px;
  padding: 10px;
  text-align: center;
}
.tip {
  color: #888;
  font-size: 12px;
  line-height: 1.7;
}
.tip code {
  background: #f0f0f0;
  border-radius: 3px;
  padding: 0 4px;
}
/* 中间表格 */
.sheet-area {
  position: relative;
  flex: 1;
  min-width: 0;
}
.univer-box {
  width: 100%;
  height: 100%;
}
.preview-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: #fff;
  pointer-events: none; /* 只读方案：禁交互 */
}
.warnings {
  position: absolute;
  left: 8px;
  bottom: 8px;
  z-index: 20;
  max-width: 80%;
}
.warning {
  background: #fff3cd;
  border: 1px solid #ffe08a;
  color: #7a5b00;
  font-size: 12px;
  padding: 2px 8px;
  margin-top: 4px;
  border-radius: 3px;
}
/* 右侧属性面板 */
.right-panel {
  width: 280px;
  border-left: 1px solid #eee;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafafa;
  overflow: auto;
}
.prop-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.prop-row label {
  width: 72px;
  font-size: 12px;
  color: #555;
  flex-shrink: 0;
}
.prop-row input,
.prop-row select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  min-width: 0;
}
.prop-row input.readonly {
  background: #f5f5f5;
  color: #999;
}
.prop-tip {
  color: #888;
  font-size: 12px;
  line-height: 1.7;
}
/* 数据集动态参数弹窗 */
.param-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.param-dialog {
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.param-dialog h4 {
  margin: 0 0 6px;
  font-size: 15px;
}
.param-tip {
  color: #888;
  font-size: 12px;
  margin-bottom: 12px;
}
.param-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.param-row label {
  width: 110px;
  flex-shrink: 0;
  font-size: 13px;
  color: #333;
}
.param-row .req {
  color: #d03050;
}
.param-row input,
.param-row select {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  min-width: 0;
}
.param-row input[type='checkbox'] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
}
.param-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}
</style>
