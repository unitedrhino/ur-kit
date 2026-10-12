/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';
import type { HistoryItemType } from '@/store/modules/chartHistoryStore/chartHistoryStore.type';

import type {
  ChartEditStorage,
  ChartEditStoreType,
  ComponentMetaType,
  EditCanvasConfigType,
  EditCanvasType,
  EditorMode,
  MousePositionType,
  RecordChartType,
  RequestGlobalConfigType,
  TargetChartType,
} from './chartEditStore.type';

import { nextTick, toRaw } from 'vue';

import { MenuEnum } from '@/enums/editPageEnum';
import { captureComponentSnapshot } from '@/packages/custom/captureSnapshot';
import { PublicGroupConfigClass } from '@/packages/public/publicConfig';
import { defaultTheme, globalThemeJson } from '@/settings/chartThemes/index';
import { previewScaleType, requestInterval, requestIntervalUnit } from '@/settings/designSetting';
// 记录记录
import { useChartHistoryStore } from '@/store/modules/chartHistoryStore/chartHistoryStore';
import { HistoryActionTypeEnum, HistoryTargetTypeEnum } from '@/store/modules/chartHistoryStore/chartHistoryStore.type';
// 全局设置
import { useSettingStore } from '@/store/modules/settingStore/settingStore';
import { getUUID, isArray, isString, loadingError, loadingFinish, loadingStart } from '@/utils';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import { defineStore } from 'pinia';

import { ChartEditStoreEnum } from './chartEditStore.type';

const GROUP_SNAPSHOT_DELAY_MS = 1200;
const GROUP_SNAPSHOT_IDLE_TIMEOUT_MS = 3000;
const GROUP_SNAPSHOT_RETRY_DELAY_MS = 300;
const GROUP_SNAPSHOT_RETRY_MAX = 12;

function scheduleIdleTask(fn: () => void) {
  const globalWindow = window as typeof window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (typeof globalWindow.requestIdleCallback === 'function') {
    return globalWindow.requestIdleCallback(fn, { timeout: GROUP_SNAPSHOT_IDLE_TIMEOUT_MS });
  }
  return window.setTimeout(fn, GROUP_SNAPSHOT_RETRY_DELAY_MS);
}

async function waitForEditorIdle(store: ReturnType<typeof useChartEditStore>) {
  for (let attempt = 0; attempt < GROUP_SNAPSHOT_RETRY_MAX; attempt += 1) {
    const canvasState = store.getEditCanvas;
    if (!(canvasState.isCreate || canvasState.isDrag || canvasState.isSelect || canvasState.isCodeEdit)) {
      return true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, GROUP_SNAPSHOT_RETRY_DELAY_MS));
  }
  return false;
}

function scheduleGroupSnapshotCapture(store: ReturnType<typeof useChartEditStore>, groupId: string) {
  window.setTimeout(() => {
    scheduleIdleTask(async () => {
      const idleReady = await waitForEditorIdle(store);
      if (!idleReady) return;

      await nextTick();
      const snapshot = await captureComponentSnapshot(groupId, {
        maxWidth: 120,
        preferredScale: 1,
        quality: 0.55,
      });
      if (!snapshot) return;

      const group = store.getComponentList.find((item) => item.id === groupId) as CreateComponentGroupType | undefined;
      if (!group?.isGroup) return;
      group.chartConfig.image = snapshot;
    });
  }, GROUP_SNAPSHOT_DELAY_MS);
}

// 编辑区域内容
export const useChartEditStore = defineStore('useChartEditStore', {
  state: (): ChartEditStoreType => ({
    // 画布属性
    editCanvas: {
      // 编辑区域 Dom
      editLayoutDom: null,
      editContentDom: null,
      // 外部文件拖入中
      externalFileDrag: false,
      // 偏移量
      offset: 20,
      // 系统控制缩放
      scale: 1,
      // 用户控制的缩放
      userScale: 1,
      // 锁定缩放
      lockScale: false,
      // 初始化
      isCreate: false,
      createComponentConfig: null,
      // 拖拽中
      isDrag: false,
      // 框选中
      isSelect: false,
      // 代码编辑中
      isCodeEdit: false,
      // 隔离编辑模式
      isGroupIsolation: false,
      activeGroupId: undefined,
      // 编辑器模式（project / component）
      editorMode: 'project',
      // 组件编辑模式元数据
      componentMeta: null,
      // 组件模式模拟数据预览开关（默认开启，跳过真实请求）
      componentMockPreview: true,
    },
    // 右键菜单
    rightMenuShow: false,
    // 鼠标定位
    mousePosition: {
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
    },
    // 目标图表
    targetChart: {
      hoverId: undefined,
      selectId: [],
    },
    // 记录临时数据（复制等）
    recordChart: undefined,
    // -----------------------
    // 画布属性（需存储给后端）
    editCanvasConfig: {
      // 项目名称
      projectName: undefined,
      // 默认宽度
      width: 1920,
      // 默认高度
      height: 1080,
      // 启用滤镜
      filterShow: false,
      // 色相
      hueRotate: 0,
      // 饱和度
      saturate: 1,
      // 对比度
      contrast: 1,
      // 亮度
      brightness: 1,
      // 透明度
      opacity: 1,
      // 变换（暂不更改）
      rotateZ: 0,
      rotateX: 0,
      rotateY: 0,
      skewX: 0,
      skewY: 0,
      // 混合模式
      blendMode: 'normal',
      // 默认背景色
      background: undefined,
      backgroundImage: undefined,
      // 是否使用纯颜色
      selectColor: true,
      // chart 主题色
      chartThemeColor: defaultTheme || 'dark',
      // 自定义颜色列表
      chartCustomThemeColorInfo: undefined,
      // 全局配置
      chartThemeSetting: globalThemeJson,
      // vChart 主题
      vChartThemeName: 'vScreenVolcanoBlue',
      // 适配方式
      previewScaleType,
    },
    // 数据请求处理（需存储给后端）
    requestGlobalConfig: {
      requestDataPond: [],
      requestOriginUrl: '',
      requestInterval,
      requestIntervalUnit,
      requestParams: {
        Body: {
          'form-data': {},
          'x-www-form-urlencoded': {},
          json: '',
          xml: '',
        },
        Header: {},
        Params: {},
      },
    },
    // 图表数组（需存储给后端）
    componentList: [],
  }),
  getters: {
    getMousePosition(): MousePositionType {
      return this.mousePosition;
    },
    getRightMenuShow(): boolean {
      return this.rightMenuShow;
    },
    getEditCanvas(): EditCanvasType {
      return this.editCanvas;
    },
    getEditCanvasConfig(): EditCanvasConfigType {
      return this.editCanvasConfig;
    },
    getTargetChart(): TargetChartType {
      return this.targetChart;
    },
    getRecordChart(): RecordChartType | undefined {
      return this.recordChart;
    },
    getRequestGlobalConfig(): RequestGlobalConfigType {
      return this.requestGlobalConfig;
    },
    getComponentList(): Array<CreateComponentGroupType | CreateComponentType> {
      return this.componentList;
    },
    getEditorMode(): EditorMode {
      return this.editCanvas.editorMode;
    },
    getIsComponentMode(): boolean {
      return this.editCanvas.editorMode === 'component';
    },
    getComponentMeta(): ComponentMetaType | null {
      return this.editCanvas.componentMeta;
    },
    getComponentMockPreview(): boolean {
      return this.editCanvas.componentMockPreview ?? true;
    },
  },
  actions: {
    // * 获取需要存储的数据项
    getStorageInfo(): ChartEditStorage {
      return {
        [ChartEditStoreEnum.EDIT_CANVAS_CONFIG]: this.getEditCanvasConfig,
        [ChartEditStoreEnum.COMPONENT_LIST]: this.getComponentList,
        [ChartEditStoreEnum.REQUEST_GLOBAL_CONFIG]: this.getRequestGlobalConfig,
      };
    },
    // * 获取针对 componentList 顺序排过序的 selectId
    getSelectIdSortList(ids?: string[]): string[] {
      if (this.getTargetChart.selectId.length === 0 && !ids) return [];
      const sortArr: string[] = [];
      this.getComponentList.forEach((item: CreateComponentGroupType | CreateComponentType) => {
        if (ids) {
          ids.forEach((id: string) => {
            if (item.id === id) {
              sortArr.push(id);
            }
          });
        } else {
          this.getTargetChart.selectId.forEach((id: string) => {
            if (item.id === id) {
              sortArr.push(id);
            }
          });
        }
      });
      return sortArr;
    },
    // * 设置 editCanvas 数据项
    setEditCanvas<T extends keyof EditCanvasType, K extends EditCanvasType[T]>(key: T, value: K) {
      this.editCanvas[key] = value;
    },
    // * 设置 editCanvasConfig（需保存后端） 数据项
    setEditCanvasConfig<T extends keyof EditCanvasConfigType, K extends EditCanvasConfigType[T]>(key: T, value: K) {
      this.editCanvasConfig[key] = value;
    },
    // * 进入 Group 隔离编辑模式
    enterGroupIsolation(groupId: string) {
      this.editCanvas.isGroupIsolation = true;
      this.editCanvas.activeGroupId = groupId;
    },
    // * 退出 Group 隔离编辑模式
    exitGroupIsolation() {
      this.editCanvas.isGroupIsolation = false;
      this.editCanvas.activeGroupId = undefined;
    },
    // * 进入组件编辑模式
    enterComponentMode(meta: ComponentMetaType) {
      this.editCanvas.editorMode = 'component';
      this.editCanvas.componentMeta = meta;
    },
    // * 退出组件编辑模式
    exitComponentMode() {
      this.editCanvas.editorMode = 'project';
      this.editCanvas.componentMeta = null;
    },
    // * 切换组件模式模拟数据预览
    setComponentMockPreview(value: boolean) {
      this.editCanvas.componentMockPreview = value;
    },
    // * 模式切换时重置编辑器状态，防止跨模式数据污染
    resetForModeSwitch() {
      this.componentList = [];
      this.setTargetSelectChart(undefined);
      this.editCanvas.isCreate = false;
      this.editCanvas.createComponentConfig = null;
      // 退出 Group 隔离模式
      if (this.editCanvas.isGroupIsolation) {
        this.exitGroupIsolation();
      }
      // 退出组件编辑模式
      // loadProjectData() 不会重置 editorMode/componentMeta，必须显式清理
      // 否则从组件模式切回大屏模式走复用路径时，UI 仍按组件模式渲染
      if (this.editCanvas.editorMode === 'component') {
        this.exitComponentMode();
      }
      // 重置模拟数据预览为默认开启
      this.editCanvas.componentMockPreview = true;
      this.editCanvas.externalFileDrag = false;

      // 重置画布配置到默认值（1920×1080 大屏规格）
      // 组件模式会修改 width/height/background/backgroundImage，切回大屏时若不重置，
      // loadProjectData 的 merge 策略（...defaultData, ...parsed）只会覆盖 parsed 中存在的字段，
      // 残留的 component 模式值会导致大屏画布呈现小组件尺寸 + 无背景
      this.editCanvasConfig.width = 1920;
      this.editCanvasConfig.height = 1080;
      this.editCanvasConfig.background = undefined;
      this.editCanvasConfig.backgroundImage = undefined;
      this.editCanvasConfig.selectColor = true;

      // 重置缩放（组件模式 zoom-to-fit 会将 scale 设为非 1 的值）
      this.editCanvas.scale = 1;
      this.editCanvas.userScale = 1;
    },
    // * 设置右键菜单
    setRightMenuShow(value: boolean) {
      this.rightMenuShow = value;
    },
    // * 设置目标数据 hover
    setTargetHoverChart(hoverId?: TargetChartType['hoverId']) {
      this.targetChart.hoverId = hoverId;
    },
    // * 设置目标数据 select
    setTargetSelectChart(selectId?: string | string[], push: boolean = false) {
      // 重复选中
      if (this.targetChart.selectId.find((e: string) => e === selectId)) return;

      // 无 id 清空
      if (!selectId) {
        this.targetChart.selectId = [];
        return;
      }
      // 多选
      if (push) {
        // 字符串
        if (isString(selectId)) {
          this.targetChart.selectId.push(selectId);
          return;
        }
        // 数组
        if (isArray(selectId)) {
          this.targetChart.selectId.push(...selectId);
        }
      } else {
        // 字符串
        if (isString(selectId)) {
          this.targetChart.selectId = [selectId];
          return;
        }
        // 数组
        if (isArray(selectId)) {
          this.targetChart.selectId = selectId;
        }
      }
    },
    // * 设置记录数据
    setRecordChart(item: RecordChartType | undefined) {
      this.recordChart = cloneDeep(item);
    },
    // * 设置鼠标位置
    setMousePosition(x?: number, y?: number, startX?: number, startY?: number): void {
      if (x) this.mousePosition.x = x;
      if (y) this.mousePosition.y = y;
      if (startX) this.mousePosition.startX = startX;
      if (startY) this.mousePosition.startY = startY;
    },
    // * 找到目标 id 数据的下标位置，id可为父级或子集数组（无则返回-1）
    fetchTargetIndex(id?: string): number {
      const targetId = id || (this.getTargetChart.selectId.length && this.getTargetChart.selectId[0]) || undefined;
      if (!targetId) {
        loadingFinish();
        return -1;
      }
      const targetIndex = this.componentList.findIndex((e) => e.id === targetId);

      // 当前
      if (targetIndex === -1) {
        const length = this.getComponentList.length;
        for (let i = 0; i < length; i++) {
          const listItem = this.getComponentList[i];
          if (listItem?.isGroup) {
            for (const cItem of (listItem as CreateComponentGroupType).groupList) {
              if (cItem.id === targetId) {
                return i;
              }
            }
          }
        }
      } else {
        return targetIndex;
      }
      return -1;
    },
    // * 统一格式化处理入参 id
    idPreFormat(id?: string | string[]) {
      const idArr: string[] = [];
      if (!id) {
        idArr.push(...this.getTargetChart.selectId);
        return idArr;
      }
      if (isString(id)) idArr.push(id);
      if (isArray(id)) idArr.push(...id);
      return idArr;
    },
    /**
     * 新增组件列表
     * @param componentInstance 新图表实例
     * @param isHead 是否头部插入
     * @param isHistory 是否进行记录
     * @returns
     */
    addComponentList(
      componentInstance: Array<CreateComponentGroupType | CreateComponentType> | CreateComponentGroupType | CreateComponentType,
      isHead = false,
      isHistory = false,
    ): void {
      const chartHistoryStore = useChartHistoryStore();
      if (Array.isArray(componentInstance)) {
        componentInstance.forEach((item) => {
          this.addComponentList(item, isHead, isHistory);
        });
        return;
      }
      if (isHistory) {
        chartHistoryStore.createAddHistory([componentInstance]);
      }
      if (isHead) {
        this.componentList.unshift(componentInstance);
        return;
      }
      this.componentList.push(componentInstance);
    },
    // * 删除组件
    removeComponentList(id?: string | string[], isHistory = true): void {
      try {
        const chartHistoryStore = useChartHistoryStore();
        const idArr = this.idPreFormat(id);
        const history: Array<CreateComponentGroupType | CreateComponentType> = [];
        // 遍历所有对象
        if (idArr.length === 0) return;

        loadingStart();
        idArr.forEach((ids) => {
          const index = this.fetchTargetIndex(ids);
          if (index !== -1) {
            const targetComponent = this.getComponentList[index];
            if (targetComponent) {
              history.push(targetComponent);
              this.componentList.splice(index, 1);
            }
          }
        });
        isHistory && chartHistoryStore.createDeleteHistory(history);
        loadingFinish();
      } catch {
        loadingError();
      }
    },
    // * 重置组件位置
    clearCanvasComponents(): void {
      const ids = this.getComponentList.map((item) => item.id);
      if (ids.length === 0) return;
      this.setTargetSelectChart(undefined);
      this.removeComponentList(ids, true);
    },
    clearGroupComponents(groupId: string, isHistory = true): void {
      const chartHistoryStore = useChartHistoryStore();
      const groupIndex = this.fetchTargetIndex(groupId);
      if (groupIndex === -1) return;

      const group = this.getComponentList[groupIndex] as CreateComponentGroupType;
      if (!group?.isGroup || !group.groupList?.length) return;

      const groupSnapshot = cloneDeep(toRaw(group));
      if (isHistory) {
        chartHistoryStore.createClearGroupHistory([groupSnapshot]);
      }

      const selectedChildIds = new Set(group.groupList.map((item) => item.id));
      const nextGroup = cloneDeep(group);
      nextGroup.groupList = [];
      this.updateComponentList(groupIndex, nextGroup);

      if (this.getTargetChart.selectId.some((id) => selectedChildIds.has(id))) {
        this.setTargetSelectChart(undefined);
      }
    },
    // * ??????
    resetComponentPosition(item: CreateComponentGroupType | CreateComponentType, isForward: boolean): void {
      const index = this.fetchTargetIndex(item.id);
      const componentInstance = index > -1 ? this.getComponentList[index] : undefined;
      if (componentInstance) {
        componentInstance.attr = isForward
          ? Object.assign(componentInstance.attr, {
              x: item.attr.x + item.attr.offsetX,
              y: item.attr.y + item.attr.offsetY,
            })
          : Object.assign(componentInstance.attr, {
              x: item.attr.x,
              y: item.attr.y,
            });
      }
    },
    moveComponentList(item: Array<CreateComponentGroupType | CreateComponentType>) {
      const chartHistoryStore = useChartHistoryStore();
      chartHistoryStore.createMoveHistory(item);
    },
    // * 更新组件列表某一项的值
    updateComponentList(index: number, newData: CreateComponentGroupType | CreateComponentType) {
      if (index < 1 && index > this.getComponentList.length) return;
      this.componentList[index] = newData;
    },
    // * 设置页面样式属性
    setPageStyle<T extends keyof CSSStyleDeclaration>(key: T, value: any): void {
      const dom = this.getEditCanvas.editContentDom;
      if (dom) {
        dom.style[key] = value;
      }
    },
    // * 移动组件列表层级位置到两端
    setBothEnds(isEnd = false, isHistory = true): void {
      try {
        const chartHistoryStore = useChartHistoryStore();
        // 暂不支持多选
        if (this.getTargetChart.selectId.length > 1) return;

        loadingStart();
        const length = this.getComponentList.length;
        if (length < 2) {
          loadingFinish();
          return;
        }

        const index = this.fetchTargetIndex();
        const targetData = this.getComponentList[index];
        if (index !== -1 && targetData) {
          // 置底排除最底层, 置顶排除最顶层
          if ((isEnd && index === 0) || (!isEnd && index === length - 1)) {
            loadingFinish();
            return;
          }

          // 记录原有位置
          const setIndex = (componentInstance: CreateComponentGroupType | CreateComponentType, i: number) => {
            const temp = cloneDeep(componentInstance);
            temp.attr.zIndex = i;
            return temp;
          };

          // 历史记录
          if (isHistory) {
            chartHistoryStore.createLayerHistory([setIndex(targetData, index)], isEnd ? HistoryActionTypeEnum.BOTTOM : HistoryActionTypeEnum.TOP);
          }

          // 插入两端
          this.addComponentList(targetData, isEnd);
          this.getComponentList.splice(isEnd ? index + 1 : index, 1);
          loadingFinish();
        }
      } catch {
        loadingError();
      }
    },
    // * 置顶
    setTop(isHistory = true): void {
      this.setBothEnds(false, isHistory);
    },
    // * 置底
    setBottom(isHistory = true): void {
      this.setBothEnds(true, isHistory);
    },
    // * 上移/下移互换图表位置
    wrap(isDown = false, isHistory = true) {
      try {
        const chartHistoryStore = useChartHistoryStore();
        // 暂不支持多选
        if (this.getTargetChart.selectId.length > 1) return;

        loadingStart();
        const length = this.getComponentList.length;
        if (length < 2) {
          loadingFinish();
          return;
        }

        const index: number = this.fetchTargetIndex();
        if (index !== -1) {
          // 下移排除最底层, 上移排除最顶层
          if ((isDown && index === 0) || (!isDown && index === length - 1)) {
            loadingFinish();
            return;
          }
          // 互换位置
          const swapIndex = isDown ? index - 1 : index + 1;
          const targetItem = this.getComponentList[index];
          const swapItem = this.getComponentList[swapIndex];
          if (!targetItem || !swapItem) {
            loadingFinish();
            return;
          }

          // 历史记录
          if (isHistory) {
            chartHistoryStore.createLayerHistory([targetItem], isDown ? HistoryActionTypeEnum.DOWN : HistoryActionTypeEnum.UP);
          }
          this.updateComponentList(index, swapItem);
          this.updateComponentList(swapIndex, targetItem);
          loadingFinish();
        }
      } catch {
        loadingError();
      }
    },
    // * 图层上移
    setUp(isHistory = true) {
      this.wrap(false, isHistory);
    },
    // * 图层下移
    setDown(isHistory = true) {
      this.wrap(true, isHistory);
    },
    // * 复制
    setCopy(isCut = false) {
      try {
        // 暂不支持多选
        if (this.getTargetChart.selectId.length > 1) return;
        // 处理弹窗普通复制的场景
        if (document.querySelectorAll('.n-modal-body-wrapper').length > 0) return;

        loadingStart();
        const index: number = this.fetchTargetIndex();
        if (index !== -1) {
          const targetComponent = this.getComponentList[index];
          if (!targetComponent) {
            loadingFinish();
            return;
          }
          const copyData: RecordChartType = {
            charts: targetComponent,
            type: isCut ? HistoryActionTypeEnum.CUT : HistoryActionTypeEnum.COPY,
          };
          this.setRecordChart(copyData);
          window.$message.success(isCut ? editorT('bigscreenEditor.ui.helperChartCutSuccessfully') : editorT('bigscreenEditor.ui.helperChartCopiedSuccessfully'));
          loadingFinish();
        }
      } catch {
        loadingError();
      }
    },
    // * 剪切
    setCut() {
      this.setCopy(true);
    },
    // * 粘贴
    setParse() {
      try {
        loadingStart();
        const recordCharts = this.getRecordChart;
        if (recordCharts === undefined) {
          loadingFinish();
          return;
        }
        const parseHandle = (e: CreateComponentGroupType | CreateComponentType) => {
          e = cloneDeep(e);
          e.attr.x = this.getMousePosition.startX;
          e.attr.y = this.getMousePosition.startY;
          // 外层生成新 id
          e.id = getUUID();
          // 分组列表生成新 id
          if (e.isGroup) {
            (e as CreateComponentGroupType).groupList.forEach((item: CreateComponentType) => {
              item.id = getUUID();
            });
          }

          return e;
        };
        const isCut = recordCharts.type === HistoryActionTypeEnum.CUT;
        const targetList = Array.isArray(recordCharts.charts) ? recordCharts.charts : [recordCharts.charts];
        // 多项
        targetList.forEach((e: CreateComponentGroupType | CreateComponentType) => {
          this.addComponentList(parseHandle(e), undefined, true);
          // 剪切需删除原数据
          if (isCut) {
            this.setTargetSelectChart(e.id);
            this.removeComponentList(undefined, true);
          }
        });
        if (isCut) this.setRecordChart(undefined);
        loadingFinish();
      } catch {
        loadingError();
      }
    },
    // * 撤回/前进 目标处理
    setBackAndSetForwardHandle(HistoryItem: HistoryItemType, isForward = false) {
      // 处理画布
      if (HistoryItem.targetType === HistoryTargetTypeEnum.CANVAS) {
        this.editCanvas = HistoryItem.historyData[0] as EditCanvasType;
        return;
      }

      // 取消选中
      this.setTargetSelectChart();

      // 重新选中
      const historyData = HistoryItem.historyData as Array<CreateComponentGroupType | CreateComponentType>;
      if (isArray(historyData)) {
        // 选中目标元素，支持多个
        historyData.forEach((item: CreateComponentGroupType | CreateComponentType) => {
          this.setTargetSelectChart(item.id, true);
        });
      }

      // 处理新增类型
      const isAdd = HistoryItem.actionType === HistoryActionTypeEnum.ADD;
      const isDel = HistoryItem.actionType === HistoryActionTypeEnum.DELETE;
      if (isAdd || isDel) {
        if ((isAdd && isForward) || (isDel && !isForward)) {
          historyData.forEach((item) => {
            this.addComponentList(item);
          });
          return;
        }
        historyData.forEach((item) => {
          this.removeComponentList(item.id, false);
        });
        return;
      }

      // 处理移动
      const isMove = HistoryItem.actionType === HistoryActionTypeEnum.MOVE;
      if (isMove) {
        historyData.forEach((item) => {
          this.resetComponentPosition(item, isForward);
        });
        return;
      }

      // 处理层级
      const isTop = HistoryItem.actionType === HistoryActionTypeEnum.TOP;
      const isBottom = HistoryItem.actionType === HistoryActionTypeEnum.BOTTOM;
      if (isTop || isBottom) {
        if (!isForward) {
          // 插入到原有位置
          if (isTop) this.getComponentList.pop();
          if (isBottom) this.getComponentList.shift();
          const historyFirst = historyData[0];
          if (historyFirst) {
            this.getComponentList.splice(historyFirst.attr.zIndex, 0, historyFirst);
          }
          return;
        }
        if (isTop) this.setTop(false);
        if (isBottom) this.setBottom(false);
      }

      const isUp = HistoryItem.actionType === HistoryActionTypeEnum.UP;
      const isDown = HistoryItem.actionType === HistoryActionTypeEnum.DOWN;
      if (isUp || isDown) {
        if ((isUp && isForward) || (isDown && !isForward)) {
          this.setUp(false);
          return;
        }
        this.setDown(false);
        return;
      }

      // 处理分组
      const isGroup = HistoryItem.actionType === HistoryActionTypeEnum.GROUP;
      const isUnGroup = HistoryItem.actionType === HistoryActionTypeEnum.UN_GROUP;
      if (isGroup || isUnGroup) {
        if ((isGroup && isForward) || (isUnGroup && !isForward)) {
          const ids: string[] = [];
          if (historyData.length > 1) {
            historyData.forEach((item) => {
              ids.push(item.id);
            });
          } else {
            const group = historyData[0] as CreateComponentGroupType;
            group.groupList.forEach((item) => {
              ids.unshift(item.id);
            });
          }
          this.setGroup(ids, false);
          return;
        }
        // 都需使用子组件的id去解组
        if (historyData.length > 1) {
          this.setUnGroup([(historyData[0] as CreateComponentType).id], undefined, false);
        } else {
          const firstChild = (historyData[0] as CreateComponentGroupType).groupList[0];
          if (firstChild) this.setUnGroup([firstChild.id], undefined, false);
        }
        return;
      }

      // 处理锁定
      const isClearGroup = HistoryItem.actionType === HistoryActionTypeEnum.CLEAR_GROUP;
      if (isClearGroup) {
        const groupSnapshot = cloneDeep(historyData[0] as CreateComponentGroupType);
        const targetIndex = this.fetchTargetIndex(groupSnapshot.id);
        if (targetIndex === -1) return;

        if (isForward) {
          this.clearGroupComponents(groupSnapshot.id, false);
          return;
        }

        this.updateComponentList(targetIndex, groupSnapshot);
        return;
      }

      const isLock = HistoryItem.actionType === HistoryActionTypeEnum.LOCK;
      const isUnLock = HistoryItem.actionType === HistoryActionTypeEnum.UNLOCK;
      if (isLock || isUnLock) {
        if ((isLock && isForward) || (isUnLock && !isForward)) {
          historyData.forEach((item) => {
            this.setLock(!item.status.lock, false);
          });
          return;
        }
        historyData.forEach((item) => {
          this.setUnLock(false);
        });
        return;
      }

      // 处理隐藏
      const isHide = HistoryItem.actionType === HistoryActionTypeEnum.HIDE;
      const isShow = HistoryItem.actionType === HistoryActionTypeEnum.SHOW;
      if (isHide || isShow) {
        if ((isHide && isForward) || (isShow && !isForward)) {
          historyData.forEach((item) => {
            this.setHide(!item.status.hide, false);
          });
          return;
        }
        historyData.forEach((item) => {
          this.setShow(false);
        });
      }
    },
    // * 撤回
    setBack() {
      try {
        const chartHistoryStore = useChartHistoryStore();
        loadingStart();
        const targetData = chartHistoryStore.backAction();
        if (!targetData) {
          loadingFinish();
          return;
        }
        this.setBackAndSetForwardHandle(targetData);
        loadingFinish();
      } catch {
        loadingError();
      }
    },
    // * 前进
    setForward() {
      try {
        const chartHistoryStore = useChartHistoryStore();
        loadingStart();
        const targetData = chartHistoryStore.forwardAction();
        if (!targetData) {
          loadingFinish();
          return;
        }
        this.setBackAndSetForwardHandle(targetData, true);
        loadingFinish();
      } catch {
        loadingError();
      }
    },
    // * 移动位置
    setMove(keyboardValue: MenuEnum) {
      const settingStore = useSettingStore();
      const index = this.fetchTargetIndex();
      if (index === -1) return;
      const targetComponent = this.getComponentList[index];
      if (!targetComponent) return;
      const attr = targetComponent.attr;
      const distance = settingStore.getChartMoveDistance;
      switch (keyboardValue) {
        case MenuEnum.ARROW_DOWN: {
          attr.y += distance;
          break;
        }
        case MenuEnum.ARROW_LEFT: {
          attr.x -= distance;
          break;
        }
        case MenuEnum.ARROW_RIGHT: {
          attr.x += distance;
          break;
        }
        case MenuEnum.ARROW_UP: {
          attr.y -= distance;
          break;
        }
      }
    },
    // * 创建分组
    setGroup(id?: string | string[], isHistory = true) {
      try {
        const chartHistoryStore = useChartHistoryStore();
        let selectIds = this.idPreFormat(id) || this.getTargetChart.selectId;
        selectIds = this.getSelectIdSortList(selectIds);
        if (selectIds.length < 2) return;

        loadingStart();
        const groupClass = new PublicGroupConfigClass();
        const targetList: CreateComponentType[] = [];
        const historyList: CreateComponentType[] = [];

        // 若目标中有数组则先解组
        const newSelectIds: string[] = [];
        selectIds.forEach((id: string) => {
          const targetIndex = this.fetchTargetIndex(id);
          const targetComponent = targetIndex !== -1 ? this.getComponentList[targetIndex] : undefined;
          if (targetComponent?.isGroup) {
            this.setUnGroup(
              [id],
              (e: CreateComponentType[]) => {
                e.forEach((e) => {
                  this.addComponentList(e);
                  newSelectIds.push(e.id);
                });
              },
              false,
            );
          } else if (targetIndex !== -1) {
            newSelectIds.push(id);
          }
        });

        const selectedIdSet = new Set(newSelectIds);
        const selectedComponents = this.getComponentList.filter((item): item is CreateComponentType => {
          return selectedIdSet.has(item.id) && !item.isGroup;
        });
        if (selectedComponents.length < 2) {
          loadingFinish();
          return;
        }

        // 记录整体坐标
        const groupAttr = {
          l: 0,
          t: 0,
          r: 0,
          b: 0,
        };

        selectedComponents.forEach((item: CreateComponentType, index: number) => {
          const { x, y, w, h } = item.attr;
          if (index === 0) {
            groupAttr.l = x;
            groupAttr.t = y;
            groupAttr.r = x + w;
            groupAttr.b = y + h;
          } else {
            const { l, t, r, b } = groupAttr;
            // 左
            groupAttr.l = Math.min(l, x);
            // 上
            groupAttr.t = Math.min(t, y);
            // 宽
            groupAttr.r = Math.max(r, x + w);
            // 高
            groupAttr.b = Math.max(b, y + h);
          }

          targetList.push(item);
          if (isHistory) {
            historyList.push(cloneDeep(toRaw(item)));
          }
        });

        const selectedIndexes = this.getComponentList
          .map((item, index) => (selectedIdSet.has(item.id) ? index : -1))
          .filter((index) => index !== -1)
          .sort((left, right) => right - left);

        selectedIndexes.forEach((index) => {
          this.componentList.splice(index, 1);
        });

        // 修改原数据之前，先记录
        if (isHistory) chartHistoryStore.createGroupHistory(historyList);

        // 设置子组件的位置
        targetList.forEach((item: CreateComponentType) => {
          item.attr.x = item.attr.x - groupAttr.l;
          item.attr.y = item.attr.y - groupAttr.t;
          groupClass.groupList.push(item);
        });

        // 设置 group 属性
        groupClass.attr.x = groupAttr.l;
        groupClass.attr.y = groupAttr.t;
        groupClass.attr.w = groupAttr.r - groupAttr.l;
        groupClass.attr.h = groupAttr.b - groupAttr.t;

        // 记录设计尺寸，用于 resize 时计算内容缩放比
        groupClass.option.designWidth = groupClass.attr.w;
        groupClass.option.designHeight = groupClass.attr.h;

        this.componentList.push(groupClass);
        this.setTargetSelectChart(groupClass.id);
        scheduleGroupSnapshotCapture(this, groupClass.id);

        loadingFinish();
      } catch (error) {
        console.error('[chartEditStore] 创建分组失败:', error);
        window.$message.error(editorT('bigscreenEditor.ui.helperCouldNotCreateTheGroupContactYourAdministrator'));
        loadingFinish();
      }
    },
    // * 解除分组
    setUnGroup(ids?: string[], callBack?: (e: CreateComponentType[]) => void, isHistory = true) {
      try {
        const chartHistoryStore = useChartHistoryStore();
        const selectGroupIdArr = ids || this.getTargetChart.selectId;
        if (selectGroupIdArr.length !== 1) return;
        loadingStart();

        // 解组
        const unGroup = (targetIndex: number) => {
          const targetGroup = this.getComponentList[targetIndex] as CreateComponentGroupType;
          if (!targetGroup.isGroup) return;

          // 记录数据
          if (isHistory) chartHistoryStore.createUnGroupHistory(cloneDeep([targetGroup]));

          // 分离组件并还原位置属性
          targetGroup.groupList.forEach((item) => {
            item.attr.x = item.attr.x + targetGroup.attr.x;
            item.attr.y = item.attr.y + targetGroup.attr.y;
            if (!callBack) {
              // 子组件可能来自模板加载（desensitizeChildComponent 清空了 id），
              // 解组后需重新分配 UUID 以避免 id 为空字符串导致无法选取
              item.id = getUUID();
              this.addComponentList(item);
            }
          });
          this.setTargetSelectChart(undefined);
          // 删除分组
          this.removeComponentList(targetGroup.id, false);

          if (callBack) {
            callBack(targetGroup.groupList);
          }
        };

        const targetIndex = this.fetchTargetIndex(selectGroupIdArr[0]);
        // 判断目标是否为分组父级
        if (targetIndex !== -1) {
          unGroup(targetIndex);
        }

        loadingFinish();
      } catch (error) {
        console.error('[chartEditStore] 解除分组失败:', error);
        window.$message.error(editorT('bigscreenEditor.ui.helperCouldNotUngroupContactYourAdministrator'));
        loadingFinish();
      }
    },
    // * 锁定
    setLock(status: boolean = true, isHistory: boolean = true) {
      try {
        const chartHistoryStore = useChartHistoryStore();
        // 暂不支持多选
        if (this.getTargetChart.selectId.length > 1) return;

        loadingStart();
        const index: number = this.fetchTargetIndex();
        if (index !== -1) {
          // 更新状态
          const targetItem = this.getComponentList[index];
          if (!targetItem) {
            loadingFinish();
            return;
          }
          targetItem.status.lock = status;

          // 历史记录
          if (isHistory) {
            status ? chartHistoryStore.createLockHistory([targetItem]) : chartHistoryStore.createUnLockHistory([targetItem]);
          }
          this.updateComponentList(index, targetItem);
          // 锁定添加失焦效果
          if (status) this.setTargetSelectChart(undefined);
          loadingFinish();
        }
      } catch {
        loadingError();
      }
    },
    // * 解除锁定
    setUnLock(isHistory: boolean = true) {
      this.setLock(false, isHistory);
    },
    // * 隐藏
    setHide(status: boolean = true, isHistory: boolean = true) {
      try {
        const chartHistoryStore = useChartHistoryStore();
        // 暂不支持多选
        if (this.getTargetChart.selectId.length > 1) return;

        loadingStart();
        const index: number = this.fetchTargetIndex();
        if (index !== -1) {
          // 更新状态
          const targetItem = this.getComponentList[index];
          if (!targetItem) {
            loadingFinish();
            return;
          }
          targetItem.status.hide = status;

          // 历史记录
          if (isHistory) {
            status ? chartHistoryStore.createHideHistory([targetItem]) : chartHistoryStore.createShowHistory([targetItem]);
          }
          this.updateComponentList(index, targetItem);
          loadingFinish();

          // 隐藏添加失焦效果
          if (status) this.setTargetSelectChart(undefined);
        }
      } catch {
        loadingError();
      }
    },
    // * 显示
    setShow(isHistory: boolean = true) {
      this.setHide(false, isHistory);
    },
    // ----------------
    // * 设置页面大小
    setPageSize(scale: number): void {
      this.setPageStyle('height', `${this.editCanvasConfig.height * scale}px`);
      this.setPageStyle('width', `${this.editCanvasConfig.width * scale}px`);
    },
    // * 计算缩放
    computedScale() {
      if (this.getEditCanvas.editLayoutDom) {
        // 现有展示区域
        const width = this.getEditCanvas.editLayoutDom.clientWidth - this.getEditCanvas.offset * 2 - 5;
        const height = this.getEditCanvas.editLayoutDom.clientHeight - this.getEditCanvas.offset * 4;

        // 用户设定大小
        const editCanvasWidth = this.editCanvasConfig.width;
        const editCanvasHeight = this.editCanvasConfig.height;

        // 需保持的比例
        const baseProportion = Number.parseFloat((editCanvasWidth / editCanvasHeight).toFixed(5));
        const currentRate = Number.parseFloat((width / height).toFixed(5));

        if (currentRate > baseProportion) {
          // 表示更宽
          const scaleWidth = Number.parseFloat(((height * baseProportion) / editCanvasWidth).toFixed(5));
          this.setScale(Math.min(scaleWidth, 1));
        } else {
          // 表示更高
          const scaleHeight = Number.parseFloat((width / baseProportion / editCanvasHeight).toFixed(5));
          this.setScale(Math.min(scaleHeight, 1));
        }
      } else {
        window.$message.warning(editorT('bigscreenEditor.ui.helperCreateACanvasBeforeZooming'));
      }
    },
    // * 监听缩放
    listenerScale(): Function {
      const resize = debounce(this.computedScale, 200);
      // 默认执行一次
      resize();
      // 开始监听
      window.addEventListener('resize', resize);
      // 销毁函数
      const remove = () => {
        window.removeEventListener('resize', resize);
      };
      return remove;
    },
    /**
     * 设置缩放
     * @param scale 0~1 number 缩放比例;
     * @param force boolean 强制缩放
     */
    setScale(scale: number, force = false): void {
      if (!this.getEditCanvas.lockScale || force) {
        this.setPageSize(scale);
        this.getEditCanvas.userScale = scale;
        this.getEditCanvas.scale = scale;
      }
    },
    // ========== 增强版 Group 子组件管理 ==========
    // * 添加子组件
    addGroupChild(groupId: string, componentConfig: CreateComponentType) {
      const chartHistoryStore = useChartHistoryStore();
      const groupIndex = this.fetchTargetIndex(groupId);
      if (groupIndex === -1) return;

      const group = this.getComponentList[groupIndex] as CreateComponentGroupType;
      if (!group?.isGroup || !group.groupList) return;

      // 创建新子组件实例
      const newChild = { ...componentConfig } as CreateComponentType;
      newChild.id = getUUID();

      // 计算默认位置（居中）
      const defaultW = newChild.attr?.w || 200;
      const defaultH = newChild.attr?.h || 150;
      newChild.attr = newChild.attr || { w: defaultW, h: defaultH, x: 0, y: 0, zIndex: -1 };
      newChild.attr.x = (group.attr.w - defaultW) / 2;
      newChild.attr.y = (group.attr.h - defaultH) / 2;

      // 记录历史
      chartHistoryStore.createGroupHistory([toRaw(newChild)]);

      // 添加到 groupList
      group.groupList.push(newChild);
      this.updateComponentList(groupIndex, group);

      // 选中新子组件
      this.setTargetSelectChart(newChild.id);
    },
    // * 删除子组件
    removeGroupChild(groupId: string, childId: string) {
      const chartHistoryStore = useChartHistoryStore();
      const groupIndex = this.fetchTargetIndex(groupId);
      if (groupIndex === -1) return;

      const group = this.getComponentList[groupIndex] as CreateComponentGroupType;
      if (!group?.groupList) return;

      const childIndex = group.groupList.findIndex((c: CreateComponentType) => c.id === childId);
      if (childIndex === -1) return;

      // 记录历史
      const childComponent = group.groupList[childIndex];
      if (!childComponent) return;
      chartHistoryStore.createUnGroupHistory([toRaw(childComponent)]);

      // 从 groupList 中移除
      group.groupList.splice(childIndex, 1);
      this.updateComponentList(groupIndex, group);

      // 清除选中态
      if (this.targetChart.selectId.includes(childId)) {
        const newSelectIds = this.targetChart.selectId.filter((id: string) => id !== childId);
        this.targetChart.selectId = newSelectIds;
      }
    },
    // * 移动子组件
    moveGroupChild(groupId: string, childId: string, direction: 'down' | 'up') {
      const groupIndex = this.fetchTargetIndex(groupId);
      if (groupIndex === -1) return;

      const group = this.getComponentList[groupIndex] as CreateComponentGroupType;
      if (!group?.groupList) return;

      const childIndex = group.groupList.findIndex((c: CreateComponentType) => c.id === childId);
      if (childIndex === -1) return;

      // 交换位置
      if (direction === 'up' && childIndex > 0) {
        const temp = group.groupList[childIndex];
        const target = group.groupList[childIndex - 1];
        if (!temp || !target) return;
        group.groupList[childIndex] = target;
        group.groupList[childIndex - 1] = temp;
      } else if (direction === 'down' && childIndex < group.groupList.length - 1) {
        const temp = group.groupList[childIndex];
        const target = group.groupList[childIndex + 1];
        if (!temp || !target) return;
        group.groupList[childIndex] = target;
        group.groupList[childIndex + 1] = temp;
      }

      this.updateComponentList(groupIndex, group);
    },
  },
});
