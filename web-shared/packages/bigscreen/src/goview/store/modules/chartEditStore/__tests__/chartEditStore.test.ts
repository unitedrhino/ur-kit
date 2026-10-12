import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// chartEditStore 的 import 链会拉起 goview 全量组件定义与 naive-ui（CJS 无法按名导出），
// 单测只关注 store 行为本身，这里将直接依赖全部替换为轻量桩以切断重链路
vi.mock('@/utils', () => ({
  getUUID: vi.fn(() => 'uuid-1'),
  isArray: Array.isArray,
  isString: (v: unknown) => typeof v === 'string',
  loadingStart: vi.fn(),
  loadingFinish: vi.fn(),
  loadingError: vi.fn(),
}));
vi.mock('@/packages/public/publicConfig', () => ({
  PublicGroupConfigClass: class PublicGroupConfigStub {},
}));
vi.mock('@/packages/custom/captureSnapshot', () => ({
  captureComponentSnapshot: vi.fn(),
}));
vi.mock('@/settings/chartThemes/index', () => ({
  defaultTheme: {},
  globalThemeJson: {},
}));
vi.mock('@/store/modules/chartHistoryStore/chartHistoryStore', () => ({
  useChartHistoryStore: vi.fn(() => ({
    createAddHistory: vi.fn(),
    createDeleteHistory: vi.fn(),
    createMoveHistory: vi.fn(),
    createClearGroupHistory: vi.fn(),
  })),
}));
vi.mock('@/store/modules/settingStore/settingStore', () => ({
  useSettingStore: vi.fn(() => ({})),
}));

import { useChartEditStore } from '../chartEditStore';

/** 构造最小形状的组件实例（仅含 store 行为依赖的字段） */
function makeComponent(id: string, overrides: Record<string, any> = {}) {
  return {
    id,
    isGroup: false,
    attr: { x: 0, y: 0, offsetX: 0, offsetY: 0, w: 100, h: 100 },
    ...overrides,
  } as any;
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('chartEditStore 选择状态', () => {
  it('setTargetSelectChart 单选替换、多选合并、空值清空', () => {
    const store = useChartEditStore();

    store.setTargetSelectChart('a');
    expect(store.getTargetChart.selectId).toEqual(['a']);

    // 再次设置相同 id 忽略
    store.setTargetSelectChart('a');
    expect(store.getTargetChart.selectId).toEqual(['a']);

    // push 多选
    store.setTargetSelectChart('b', true);
    expect(store.getTargetChart.selectId).toEqual(['a', 'b']);

    // 数组整体替换
    store.setTargetSelectChart(['c', 'd']);
    expect(store.getTargetChart.selectId).toEqual(['c', 'd']);

    // 空值清空
    store.setTargetSelectChart(undefined);
    expect(store.getTargetChart.selectId).toEqual([]);
  });

  it('getSelectIdSortList 按组件列表顺序输出已选 id 并过滤未知 id', () => {
    const store = useChartEditStore();
    store.addComponentList([makeComponent('c1'), makeComponent('c2'), makeComponent('c3')]);

    store.setTargetSelectChart(['c3', 'c1', 'ghost']);
    expect(store.getSelectIdSortList()).toEqual(['c1', 'c3']);

    // 显式传 ids 时按列表顺序过滤
    expect(store.getSelectIdSortList(['c2', 'ghost'])).toEqual(['c2']);
    // 全空时返回空数组
    store.setTargetSelectChart(undefined);
    expect(store.getSelectIdSortList()).toEqual([]);
  });
});

describe('chartEditStore 组件增删改', () => {
  it('addComponentList 尾插/头插/数组批量', () => {
    const store = useChartEditStore();
    store.addComponentList(makeComponent('a'));
    store.addComponentList(makeComponent('b'), true); // 头插
    store.addComponentList([makeComponent('c'), makeComponent('d')]);

    expect(store.getComponentList.map((item) => item.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('removeComponentList 按 id 删除并联动历史记录', () => {
    const store = useChartEditStore();
    store.addComponentList([makeComponent('a'), makeComponent('b')]);

    store.removeComponentList('a');
    expect(store.getComponentList.map((item) => item.id)).toEqual(['b']);

    // 不存在的 id 不抛错不误删
    store.removeComponentList('ghost');
    expect(store.getComponentList).toHaveLength(1);
  });

  it('fetchTargetIndex 支持组内子组件命中并返回组下标', () => {
    const store = useChartEditStore();
    const group = makeComponent('group-1', {
      isGroup: true,
      groupList: [makeComponent('child-1'), makeComponent('child-2')],
    });
    store.addComponentList([makeComponent('plain'), group]);

    expect(store.fetchTargetIndex('plain')).toBe(0);
    // 子组件命中返回其所在组的下标
    expect(store.fetchTargetIndex('child-2')).toBe(1);
    expect(store.fetchTargetIndex('ghost')).toBe(-1);
    // 无 id 且无选中时返回 -1
    expect(store.fetchTargetIndex()).toBe(-1);
  });

  it('clearCanvasComponents 清空组件并清除选择', () => {
    const store = useChartEditStore();
    store.addComponentList([makeComponent('a'), makeComponent('b')]);
    store.setTargetSelectChart('a');

    store.clearCanvasComponents();

    expect(store.getComponentList).toHaveLength(0);
    expect(store.getTargetChart.selectId).toEqual([]);
  });

  it('resetComponentPosition 前进叠加偏移、后退还原', () => {
    const store = useChartEditStore();
    store.addComponentList([makeComponent('a', { attr: { x: 10, y: 10, offsetX: 5, offsetY: 5 } })]);

    // 前进：以历史快照为目标叠加 offsetX/offsetY
    store.resetComponentPosition(makeComponent('a', { attr: { x: 10, y: 10, offsetX: 5, offsetY: 5 } }), true);
    expect(store.getComponentList[0].attr.x).toBe(15);

    // 后退：还原到快照坐标
    store.resetComponentPosition(makeComponent('a', { attr: { x: 10, y: 10, offsetX: 5, offsetY: 5 } }), false);
    expect(store.getComponentList[0].attr.x).toBe(10);
  });
});

describe('chartEditStore 编辑模式与画布', () => {
  it('Group 隔离模式进出互逆', () => {
    const store = useChartEditStore();
    store.enterGroupIsolation('g1');
    expect(store.getIsComponentMode).toBe(false);
    expect(store.editCanvas.isGroupIsolation).toBe(true);
    expect(store.editCanvas.activeGroupId).toBe('g1');

    store.exitGroupIsolation();
    expect(store.editCanvas.isGroupIsolation).toBe(false);
    expect(store.editCanvas.activeGroupId).toBeUndefined();
  });

  it('组件编辑模式进出互逆', () => {
    const store = useChartEditStore();
    store.enterComponentMode({ id: 'meta-1' } as any);
    expect(store.getEditorMode).toBe('component');
    expect(store.getIsComponentMode).toBe(true);
    expect(store.getComponentMeta).toEqual({ id: 'meta-1' });

    store.exitComponentMode();
    expect(store.getEditorMode).toBe('project');
    expect(store.getComponentMeta).toBeNull();
  });

  it('resetForModeSwitch 重置画布规格、缩放、选择与模式', () => {
    const store = useChartEditStore();
    store.addComponentList([makeComponent('a')]);
    store.setTargetSelectChart('a');
    store.enterComponentMode({ id: 'meta-1' } as any);
    store.setEditCanvasConfig('width', 400);
    store.setEditCanvasConfig('height', 300);
    store.setEditCanvas('scale', 0.5);

    store.resetForModeSwitch();

    expect(store.getComponentList).toHaveLength(0);
    expect(store.getTargetChart.selectId).toEqual([]);
    expect(store.getEditorMode).toBe('project');
    expect(store.getComponentMeta).toBeNull();
    expect(store.getEditCanvasConfig.width).toBe(1920);
    expect(store.getEditCanvasConfig.height).toBe(1080);
    expect(store.editCanvas.scale).toBe(1);
    expect(store.editCanvas.userScale).toBe(1);
    expect(store.getComponentMockPreview).toBe(true);
  });

  it('setEditCanvas / setEditCanvasConfig 按键写入', () => {
    const store = useChartEditStore();
    store.setEditCanvas('offset', 40);
    expect(store.getEditCanvas.offset).toBe(40);

    store.setEditCanvasConfig('projectName', '测试大屏');
    expect(store.getEditCanvasConfig.projectName).toBe('测试大屏');
  });

  it('setMousePosition 与 setRecordChart 快照隔离', () => {
    const store = useChartEditStore();
    store.setMousePosition(10, 20, 1, 2);
    expect(store.getMousePosition).toMatchObject({ x: 10, y: 20, startX: 1, startY: 2 });

    const record = { id: 'copy-1' };
    store.setRecordChart(record as any);
    record.id = 'mutated';
    // 记录的是深拷贝，外部修改不影响（getRecordChart 为值语义 getter）
    expect(store.getRecordChart?.id).toBe('copy-1');
  });

  it('setRightMenuShow 控制右键菜单显隐', () => {
    const store = useChartEditStore();
    expect(store.getRightMenuShow).toBe(false);
    store.setRightMenuShow(true);
    expect(store.getRightMenuShow).toBe(true);
  });
});
