/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType, CreateComponentGroupType, CreateComponentType, PickCreateComponentType } from '@/packages/index.type';

import { toRaw } from 'vue';

import axiosInstance from '@/api/axios';
import { DragKeyEnum, MouseEventButton } from '@/enums/editPageEnum';
import { createComponent, fetchChartComponent, fetchConfigComponent } from '@/packages';
import { GlTFModelConfig } from '@/packages/components/Decorates/Three/GlTFModel/index';
import { ImageConfig } from '@/packages/components/Informations/Mores/Image/index';
import { backgroundImageSize } from '@/settings/designSetting';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { componentInstall, getEditorFetchHeaders, JSONParse, loadingError, loadingFinish, loadingStart, setComponentPosition } from '@/utils';
import {
  CAD_MAX_SIZE_MB,
  isCadFile,
  isModelFile,
  isSupportedExternalFile,
  MODEL_MAX_SIZE_MB,
} from '@/utils/externalFile';
import { getGroupContentBounds, getGroupContentMetrics } from '@/utils/groupBounds';
import { useContextMenu } from '@/views/chart/hooks/useContextMenu.hook';
import { applyScreenTemplate } from '@/views/chart/hooks/useScreenTemplateApply.hook';
import { cloneDeep, throttle } from 'lodash';

import { instantiateTemplate } from '../../ContentCharts/components/CustomComponentContent/templateInstantiate';
import { shouldSelectByVisibleArea } from './visibleAreaHitTest';

const normalizeDropPoint = (chartEditStore: ReturnType<typeof useChartEditStore>, clientX: number, clientY: number) => {
  const layoutDom = chartEditStore.getEditCanvas.editLayoutDom;
  const scale = chartEditStore.getEditCanvas.scale || 1;
  if (!layoutDom) {
    return { x: clientX, y: clientY };
  }

  const rect = layoutDom.getBoundingClientRect();
  return {
    x: Math.round((clientX - rect.left) / scale),
    y: Math.round((clientY - rect.top) / scale),
  };
};

const isExternalImageDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return false;
  return [...files].some((file) => isSupportedExternalFile(file));
};

const hasInternalDragData = (e: DragEvent) => {
  const dataTransfer = e.dataTransfer;
  if (!dataTransfer) return false;

  return !!(
    dataTransfer.getData(DragKeyEnum.DRAG_KEY) ||
    dataTransfer.getData(DragKeyEnum.CUSTOM_DRAG_KEY) ||
    dataTransfer.getData(DragKeyEnum.SCREEN_TEMPLATE_DRAG_KEY)
  );
};

const uploadEditorImageFile = async (file: File): Promise<{ url: string; assetId?: string; assetName?: string; assetSource?: string }> => {
  if (!isSupportedExternalFile(file)) {
    throw new Error(editorT('bigscreenEditor.ui.thisFileTypeCannotBeDragged'));
  }
  // CAD 图纸体积通常较大，使用独立上限；其余文件沿用图片上限
  const maxSizeMB = isCadFile(file) ? CAD_MAX_SIZE_MB : backgroundImageSize;
  if (file.size > 1024 * 1024 * maxSizeMB) {
    throw new Error(
      isCadFile(file)
        ? editorT('bigscreenEditor.dynamic.message68', { size: String(CAD_MAX_SIZE_MB) })
        : editorT('bigscreenEditor.dynamic.message10', { size: String(backgroundImageSize) }),
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  const res = await axiosInstance.post('/api/v1/system/common/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const imageUrl = (res as any)?.data?.fileUri || (res as any)?.fileUri || (res as any)?.data?.filePath || (res as any)?.filePath || '';
  if (!imageUrl) {
    throw new Error(editorT('bigscreenEditor.ui.imageUploadFailedPleaseTryAgainLater'));
  }
  const url = String(imageUrl).trim();

  // 注册到资源库（失败不阻断，静默降级）
  try {
    const assetRes = await axiosInstance.post('/api/v1/view/asset/upload', {
      name: file.name,
      type: 'image',
      url,
      size: file.size,
    });
    const assetId = (assetRes as any)?.data?.id;
    if (assetId) {
      return { url, assetId, assetName: file.name, assetSource: 'drop' as const };
    }
  } catch { /* 静默降级 */ }

  return { url };
};

const createImageComponentAtPoint = async (x: number, y: number, file: File, index = 0) => {
  const chartEditStore = useChartEditStore();
  const result = await uploadEditorImageFile(file);
  const imageUrl = result.url;
  const newComponent = await createComponent(ImageConfig);
  newComponent.option.dataset = imageUrl;
  newComponent.chartConfig.image = imageUrl;
  newComponent.chartConfig.title = file.name || ImageConfig.title;
  if (result.assetId) {
    (newComponent.option as any).assetId = result.assetId;
    (newComponent.option as any).assetName = result.assetName;
    (newComponent.option as any).assetSource = result.assetSource;
  }

  componentInstall(newComponent.chartConfig.chartKey, fetchChartComponent(newComponent.chartConfig));
  componentInstall(newComponent.chartConfig.conKey, fetchConfigComponent(newComponent.chartConfig));

  const editCanvas = chartEditStore.getEditCanvas;
  if (!newComponent.isGroup && editCanvas.isGroupIsolation && editCanvas.activeGroupId) {
    chartEditStore.addGroupChild(editCanvas.activeGroupId, newComponent);
  } else {
    const offsetStep = 24;
    setComponentPosition(newComponent, x - newComponent.attr.w / 2 + index * offsetStep, y - newComponent.attr.h / 2 + index * offsetStep);
    chartEditStore.addComponentList(newComponent, false, true);
    chartEditStore.setTargetSelectChart(newComponent.id);
  }

  window.$message.success(editorT('bigscreenEditor.dynamic.message69', { name: String(file.name) }));
};

/** 拖入的模型文件上传：core 通用上传接口 + 资产库登记（失败静默降级） */
const uploadModelFile = async (file: File): Promise<{ url: string; assetId?: string; assetName: string }> => {
  if (file.size > 1024 * 1024 * MODEL_MAX_SIZE_MB) {
    throw new Error(editorT('bigscreenEditor.dynamic.message70', { size: String(MODEL_MAX_SIZE_MB) }));
  }

  const formData = new FormData();
  formData.append('file', file);
  const res = await axiosInstance.post('/api/v1/system/common/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const modelUrl = (res as any)?.data?.fileUri || (res as any)?.fileUri || (res as any)?.data?.filePath || (res as any)?.filePath || '';
  if (!modelUrl) {
    throw new Error(editorT('bigscreenEditor.ui.modelUploadFailedPleaseTryAgainLater'));
  }
  const url = String(modelUrl).trim();

  // 登记到资源库（失败不阻断，静默降级）
  try {
    const assetRes = await axiosInstance.post('/api/v1/view/asset/upload', {
      name: file.name,
      type: 'image',
      url,
      size: file.size,
    });
    const assetId = (assetRes as any)?.data?.id;
    if (assetId) {
      return { url, assetId, assetName: file.name };
    }
  } catch { /* 静默降级 */ }

  return { url, assetName: file.name };
};

/** 在画布落点创建 3D 模型组件并加载拖入的 GLB 模型 */
const createModelComponentAtPoint = async (x: number, y: number, file: File, index = 0) => {
  const chartEditStore = useChartEditStore();
  const result = await uploadModelFile(file);
  const newComponent = await createComponent(GlTFModelConfig);
  newComponent.option.modelUrl = result.url;
  newComponent.option.modelAssetId = result.assetId;
  newComponent.option.modelAssetName = result.assetName;
  newComponent.chartConfig.title = file.name || GlTFModelConfig.title;

  componentInstall(newComponent.chartConfig.chartKey, fetchChartComponent(newComponent.chartConfig));
  componentInstall(newComponent.chartConfig.conKey, fetchConfigComponent(newComponent.chartConfig));

  const editCanvas = chartEditStore.getEditCanvas;
  if (!newComponent.isGroup && editCanvas.isGroupIsolation && editCanvas.activeGroupId) {
    chartEditStore.addGroupChild(editCanvas.activeGroupId, newComponent);
  } else {
    const offsetStep = 24;
    setComponentPosition(newComponent, x - newComponent.attr.w / 2 + index * offsetStep, y - newComponent.attr.h / 2 + index * offsetStep);
    chartEditStore.addComponentList(newComponent, false, true);
    chartEditStore.setTargetSelectChart(newComponent.id);
  }

  window.$message.success(editorT('bigscreenEditor.dynamic.message71', { name: String(file.name) }));
};

const handleExternalImageDrop = async (e: DragEvent) => {
  const files = e.dataTransfer?.files ? [...e.dataTransfer.files] : [];
  const supportedFiles = files.filter((file) => isSupportedExternalFile(file));
  if (supportedFiles.length === 0) {
    window.$message.warning(editorT('bigscreenEditor.ui.thisFileTypeCannotBeDragged'));
    return;
  }

  // 按类型分流：模型文件创建 3D 组件，图片/CAD 文件创建图片组件（混合拖入两类都分别创建）
  const modelFiles = supportedFiles.filter((file) => isModelFile(file));
  const imageFiles = supportedFiles.filter((file) => !isModelFile(file));

  loadingStart();
  try {
    const point = normalizeDropPoint(useChartEditStore(), e.clientX, e.clientY);
    let index = 0;
    for (const file of [...modelFiles, ...imageFiles]) {
      if (isModelFile(file)) {
        await createModelComponentAtPoint(point.x, point.y, file, index);
      } else {
        await createImageComponentAtPoint(point.x, point.y, file, index);
      }
      index += 1;
    }
  } finally {
    loadingFinish();
  }
};

// * 处理自定义组件拖放到画布
const handleCustomComponentDrop = async (e: DragEvent, customDataString: string) => {
  const chartEditStore = useChartEditStore();
  const { id, name, source, thumbnail, content } = JSONParse(customDataString);

  const addTemplateInstance = (instance: CreateComponentGroupType | CreateComponentType) => {
    const editCanvas = chartEditStore.getEditCanvas;
    if (!instance.isGroup && editCanvas.isGroupIsolation && editCanvas.activeGroupId) {
      chartEditStore.addGroupChild(editCanvas.activeGroupId, instance as CreateComponentType);
      return;
    }

    setComponentPosition(instance, e.offsetX - instance.attr.w / 2, e.offsetY - instance.attr.h / 2);
    chartEditStore.addComponentList(instance, false, true);
    chartEditStore.setTargetSelectChart(instance.id);
  };

  if (source === 'local' && content) {
    const instance = instantiateTemplate(
      {
        id,
        source: 'local',
        thumbnail,
      },
      content,
    );
    addTemplateInstance(instance);
    window.$message.success(editorT('bigscreenEditor.dynamic.message72', { name: String(name) }));
    return;
  }

  const res = await fetch('/api/v1/view/component/get-one', {
    method: 'POST',
    headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id }),
  });
  const json = await res.json();
  if (json.code !== 200 || !json.data?.content) {
    window.$message.warning(editorT('bigscreenEditor.ui.failedLoadCustomComponents'));
    return;
  }

  const template = JSONParse(json.data.content);
  const instance = instantiateTemplate(
    {
      id,
      source: 'remote',
      thumbnail,
    },
    template,
  );
  addTemplateInstance(instance);

  window.$message.success(editorT('bigscreenEditor.dynamic.message72', { name: String(name) }));
};

// * 拖拽到编辑区域里
export const dragHandle = async (e: DragEvent) => {
  e.preventDefault();
  const chartEditStore = useChartEditStore();
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, false);
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.EXTERNAL_FILE_DRAG, false);

  // 优先处理自定义组件拖放（不走 loadingStart，避免 loading 状态阻塞 Vue 渲染）
  const customDataString = e.dataTransfer?.getData(DragKeyEnum.CUSTOM_DRAG_KEY) ?? '';
  if (customDataString) {
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
    try {
      await handleCustomComponentDrop(e, customDataString);
    } catch {
      window.$message.warning(editorT('bigscreenEditor.ui.failedLoadCustomComponents'));
    }
    return;
  }

  const screenTemplateDataString = e.dataTransfer?.getData(DragKeyEnum.SCREEN_TEMPLATE_DRAG_KEY) ?? '';
  if (screenTemplateDataString) {
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
    try {
      const templateData = JSONParse(screenTemplateDataString);
      if (templateData?.id) {
        await applyScreenTemplate(
          {
            id: String(templateData.id),
            name: templateData.name,
          },
          'drag',
        );
      }
    } catch {
      window.$message.warning(editorT('bigscreenEditor.ui.failedApplyTemplate'));
    }
    return;
  }

  try {
    loadingStart();

    // 获取基础组件拖拽数据
    const drayDataString = e.dataTransfer?.getData(DragKeyEnum.DRAG_KEY) ?? '';
    if (!drayDataString && isExternalImageDrop(e)) {
      loadingFinish();
      try {
        await handleExternalImageDrop(e);
      } catch (error) {
        window.$message.warning((error as Error)?.message || editorT('bigscreenEditor.ui.imageUploadFailedPleaseTryAgainLater'));
      }
      return;
    }

    if (!drayDataString) {
      loadingFinish();
      return;
    }

    // 修改状态
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
    const dropData: Exclude<ConfigType, ['image']> = JSONParse(drayDataString);
    if (dropData.disabled) {
      loadingFinish();
      return;
    }

    // 创建新图表组件
    const newComponent: CreateComponentType = await createComponent(dropData);
    if (dropData.redirectComponent) {
      dropData.dataset && (newComponent.option.dataset = dropData.dataset);
      newComponent.chartConfig.title = dropData.title;
      if (dropData.chartFrame !== undefined) newComponent.chartConfig.chartFrame = dropData.chartFrame;
      if (dropData.image) newComponent.chartConfig.image = dropData.image;
      // 从资源库配置事件中提取 assetId，回填到组件 option
      const events = (dropData as any).configEvents;
      if (events?.assetId) {
        (newComponent.option as any).assetId = events.assetId;
        (newComponent.option as any).assetName = events.assetName;
        (newComponent.option as any).assetSource = events.assetSource;
      }
    }

    // 注册图表组件到 Vue app，确保 <component :is="chartKey"> 能解析
    // 修复：基础组件拖放路径缺少 componentInstall，导致首次拖入项目中不存在的组件类型时不渲染
    componentInstall(newComponent.chartConfig.chartKey, fetchChartComponent(newComponent.chartConfig));
    componentInstall(newComponent.chartConfig.conKey, fetchConfigComponent(newComponent.chartConfig));

    // Group 隔离模式：添加到当前激活的 Group
    const editCanvas = chartEditStore.getEditCanvas;
    if (editCanvas.isGroupIsolation && editCanvas.activeGroupId) {
      chartEditStore.addGroupChild(editCanvas.activeGroupId, newComponent);
    } else {
      setComponentPosition(newComponent, e.offsetX - newComponent.attr.w / 2, e.offsetY - newComponent.attr.h / 2);
      chartEditStore.addComponentList(newComponent, false, true);
      chartEditStore.setTargetSelectChart(newComponent.id);
    }
    loadingFinish();
  } catch {
    loadingError();
    window.$message.warning(editorT('bigscreenEditor.ui.thisChartUnderDevelopment'));
  }
};

// * 进入拖拽区域
export const dragoverHandle = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const chartEditStore = useChartEditStore();
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.EXTERNAL_FILE_DRAG, !hasInternalDragData(e) && isExternalImageDrop(e));

  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
};

export const dragleaveHandle = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const nextTarget = e.relatedTarget as Node | null;
  if (nextTarget && (e.currentTarget as HTMLElement | null)?.contains(nextTarget)) {
    return;
  }

  const chartEditStore = useChartEditStore();
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.EXTERNAL_FILE_DRAG, false);
};

export const pasteExternalImageFiles = async (files: File[], clientX?: number, clientY?: number) => {
  const imageFiles = files.filter((file) => isSupportedExternalFile(file));
  if (imageFiles.length === 0) return false;

  const chartEditStore = useChartEditStore();
  const layoutDom = chartEditStore.getEditCanvas.editLayoutDom;
  const fallbackRect = layoutDom?.getBoundingClientRect();
  const basePoint = normalizeDropPoint(
    chartEditStore,
    clientX ?? (fallbackRect ? fallbackRect.left + fallbackRect.width / 2 : chartEditStore.getEditCanvasConfig.width / 2),
    clientY ?? (fallbackRect ? fallbackRect.top + fallbackRect.height / 2 : chartEditStore.getEditCanvasConfig.height / 2),
  );

  loadingStart();
  try {
    for (const [index, file] of imageFiles.entries()) {
      await createImageComponentAtPoint(basePoint.x, basePoint.y, file, index);
    }
    return true;
  } finally {
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.EXTERNAL_FILE_DRAG, false);
    loadingFinish();
  }
};

// * 不拦截默认行为点击
export const mousedownHandleUnStop = (e: MouseEvent, item?: CreateComponentGroupType | CreateComponentType) => {
  const chartEditStore = useChartEditStore();
  if (item) {
    chartEditStore.setTargetSelectChart(item.id);
    return;
  }
  chartEditStore.setTargetSelectChart(undefined);
};

// * 框选
const startConnectLineDraw = async (e: MouseEvent, createConfig: ConfigType) => {
  const chartEditStore = useChartEditStore();
  const connectLineCreateConfig = createConfig as ConnectLineCreateConfig;
  const clickPoint = {
    x: e.offsetX,
    y: e.offsetY,
  };
  if (!connectLineDraftState) {
    const newComponent = (await createComponent(createConfig)) as CreateComponentType;
    const option = newComponent.option as ConnectLineEditableOption;
    if (connectLineCreateConfig.defaultPathType) {
      option.pathType = connectLineCreateConfig.defaultPathType;
    }
    applyConnectLinePoints(newComponent, option, [clickPoint, clickPoint]);
    chartEditStore.addComponentList(newComponent, false, true);
    chartEditStore.setTargetSelectChart(newComponent.id);
    beginConnectLinePreview(chartEditStore, newComponent, clickPoint, e.screenX, e.screenY, option.pathType);
    return;
  }

  const draftComponent = getConnectLineDraftComponent(chartEditStore);
  if (!draftComponent) {
    exitConnectLineDrawMode(chartEditStore);
    return;
  }

  const draftOption = draftComponent.option as ConnectLineEditableOption;
  const points = toAbsoluteConnectLinePoints(draftComponent, draftOption);
  const nextPoints = [...points.slice(0, -1), clickPoint, clickPoint];

  applyConnectLinePoints(draftComponent, draftOption, nextPoints);
  beginConnectLinePreview(chartEditStore, draftComponent, clickPoint, e.screenX, e.screenY, draftOption.pathType);
};

export const contextmenuBoxSelect = (e: MouseEvent) => {
  const chartEditStore = useChartEditStore();
  const createConfig = chartEditStore.getEditCanvas.createComponentConfig;

  if (consumeConnectLineContextMenu(e) && chartEditStore.getEditCanvas.isCreate && createConfig?.key === 'ConnectLine') {
    finishConnectLineDraw(chartEditStore, true);
  }
};

export const mousedownBoxSelect = async (e: MouseEvent, _item?: CreateComponentGroupType | CreateComponentType) => {
  if (e.button === 1) return;
  if (window.$KeyboardActive?.space) return;

  const chartEditStore = useChartEditStore();
  const createConfig = chartEditStore.getEditCanvas.createComponentConfig;

  if (chartEditStore.getEditCanvas.isCreate && createConfig?.key === 'ConnectLine') {
    if (e.button === 2) {
      markConnectLineContextMenuConsumed();
      e.preventDefault();
      e.stopPropagation();
      finishConnectLineDraw(chartEditStore, true);
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    await startConnectLineDraw(e, createConfig);
    return;
  }

  mousedownHandleUnStop(e);

  // 记录点击初始位置
  const startOffsetX = e.offsetX;
  const startOffsetY = e.offsetY;
  const startScreenX = e.screenX;
  const startScreenY = e.screenY;

  // 记录缩放
  const scale = chartEditStore.getEditCanvas.scale;

  chartEditStore.setMousePosition(undefined, undefined, startOffsetX, startOffsetY);

  // 移动框选
  const mousemove = throttle((moveEvent: MouseEvent) => {
    // 取消当前选中
    chartEditStore.setTargetSelectChart();
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_SELECT, true);

    // 这里先把相对值算好，不然组件无法获取 startScreenX 和 startScreenY 的值
    const currX = startOffsetX + moveEvent.screenX - startScreenX;
    const currY = startOffsetY + moveEvent.screenY - startScreenY;
    chartEditStore.setMousePosition(currX, currY);

    // 计算框选的左上角和右下角
    const selectAttr = {
      // 左上角
      x1: 0,
      y1: 0,
      // 右下角
      x2: 0,
      y2: 0,
    };
    if (currX > startOffsetX && currY > startOffsetY) {
      // 右下方向
      selectAttr.x1 = startOffsetX;
      selectAttr.y1 = startOffsetY;
      selectAttr.x2 = Math.round(startOffsetX + (moveEvent.screenX - startScreenX) / scale);
      selectAttr.y2 = Math.round(startOffsetY + (moveEvent.screenY - startScreenY) / scale);
    } else if (currX > startOffsetX && currY < startOffsetY) {
      // 右上方向
      selectAttr.x1 = startOffsetX;
      selectAttr.y1 = Math.round(startOffsetY - (startScreenY - moveEvent.screenY) / scale);
      selectAttr.x2 = Math.round(startOffsetX + (moveEvent.screenX - startScreenX) / scale);
      selectAttr.y2 = startOffsetY;
    } else if (currX < startOffsetX && currY > startOffsetY) {
      selectAttr.x1 = Math.round(startOffsetX - (startScreenX - moveEvent.screenX) / scale);
      selectAttr.y1 = startOffsetY;
      selectAttr.x2 = startOffsetX;
      selectAttr.y2 = Math.round(startOffsetY + (moveEvent.screenY - startScreenY) / scale);
      // 左下方向
    } else {
      // 左上方向
      selectAttr.x1 = Math.round(startOffsetX - (startScreenX - moveEvent.screenX) / scale);
      selectAttr.y1 = Math.round(startOffsetY - (startScreenY - moveEvent.screenY) / scale);
      selectAttr.x2 = startOffsetX;
      selectAttr.y2 = startOffsetY;
    }

    // 遍历组件
    chartEditStore.getComponentList.forEach((item) => {
      if (!chartEditStore.getTargetChart.selectId.includes(item.id)) {
        // 处理左上角
        const { x, y, w, h } = item.attr;
        const targetAttr = {
          // 左上角
          x1: x,
          y1: y,
          // 右下角
          x2: x + w,
          y2: y + h,
        };
        // 全包含则选中
        if (
          targetAttr.x1 - selectAttr.x1 >= 0 &&
          targetAttr.y1 - selectAttr.y1 >= 0 &&
          targetAttr.x2 - selectAttr.x2 <= 0 &&
          targetAttr.y2 - selectAttr.y2 <= 0 &&
          !item.status.lock &&
          !item.status.hide
        ) {
          chartEditStore.setTargetSelectChart(item.id, true);
        }
      }
    });
  }, 30);

  // 鼠标抬起
  const mouseup = () => {
    // 鼠标抬起时，结束mousemove的节流函数，避免选框不消失问题
    mousemove.cancel();
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_SELECT, false);
    chartEditStore.setMousePosition(0, 0, 0, 0);
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
  };
  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
};

// * 鼠标事件
export const useMouseHandle = () => {
  const chartEditStore = useChartEditStore();
  const { onClickOutSide } = useContextMenu();
  // *  Click 事件, 松开鼠标触发
  const mouseClickHandle = (e: MouseEvent, item: CreateComponentGroupType | CreateComponentType) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.status.lock) return;
    if (!item.isGroup && !shouldSelectByVisibleArea(e, item as CreateComponentType, e.currentTarget)) {
      return;
    }
    // 若此时按下了 CTRL, 表示多选
    if (window.$KeyboardActive?.ctrl) {
      // 若已选中，则去除
      if (chartEditStore.targetChart.selectId.includes(item.id)) {
        const exList = chartEditStore.targetChart.selectId.filter((e) => e !== item.id);
        chartEditStore.setTargetSelectChart(exList);
      } else {
        chartEditStore.setTargetSelectChart(item.id, true);
      }
    }
  };

  // * 按下事件（包含移动事件）
  const mousedownHandle = (e: MouseEvent, item: CreateComponentGroupType | CreateComponentType) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.isGroup && !shouldSelectByVisibleArea(e, item as CreateComponentType, e.currentTarget)) {
      return;
    }
    const createConfig = chartEditStore.getEditCanvas.createComponentConfig;
    if (chartEditStore.getEditCanvas.isCreate && createConfig?.key === 'ConnectLine') {
      if (e.button === 2) {
        markConnectLineContextMenuConsumed();
        finishConnectLineDraw(chartEditStore, true);
        return;
      }

      if (e.button === 0) {
        void startConnectLineDraw(e, createConfig);
        return;
      }
    }

    if (item.status.lock) return;
    onClickOutSide();
    // 按下左键 + CTRL
    if (e.buttons === MouseEventButton.LEFT && window.$KeyboardActive?.ctrl) return;

    // 按下右键 + 选中多个 + 目标元素是多选子元素
    const selectId = chartEditStore.getTargetChart.selectId;
    if (e.buttons === MouseEventButton.RIGHT && selectId.length > 1 && selectId.includes(item.id)) return;

    // 选中当前目标组件
    chartEditStore.setTargetSelectChart(item.id);

    // 按下右键
    if (e.buttons === MouseEventButton.RIGHT) return;

    const scale = chartEditStore.getEditCanvas.scale;
    const canvasWidth = chartEditStore.getEditCanvasConfig.width;
    const canvasHeight = chartEditStore.getEditCanvasConfig.height;

    // 是否处于 Group 隔离编辑模式
    const isIsolation = chartEditStore.getEditCanvas.isGroupIsolation;
    const activeGroupId = chartEditStore.getEditCanvas.activeGroupId;

    // 记录图表初始位置和大小
    const targetMap = new Map();
    if (isIsolation && activeGroupId) {
      // 隔离模式：从 groupList 中读取子元素的真实位置
      const groupIdx = chartEditStore.componentList.findIndex((e) => e.id === activeGroupId);
      if (groupIdx !== -1) {
        const group = chartEditStore.getComponentList[groupIdx] as CreateComponentGroupType;
        chartEditStore.getTargetChart.selectId.forEach((id) => {
          const child = group.groupList.find((c) => c.id === id);
          if (child) {
            const { x, y, w, h } = toRaw(child).attr;
            const groupBounds = getGroupContentBounds(group);
            targetMap.set(id, { x, y, w, h, groupW: groupBounds.width, groupH: groupBounds.height });
          }
        });
      }
    } else {
      chartEditStore.getTargetChart.selectId.forEach((id) => {
        const index = chartEditStore.fetchTargetIndex(id);
        if (index !== -1) {
          const targetComponent = toRaw(chartEditStore.getComponentList[index]);
          // index 有效但组件可能已被移除，缺失时跳过本次位置记录
          if (!targetComponent) return;
          const { x, y, w, h } = targetComponent.attr;
          targetMap.set(id, { x, y, w, h });
        }
      });
    }

    // 记录点击初始位置
    const startX = e.screenX;
    const startY = e.screenY;

    // 记录历史位置（隔离模式下暂不记录，避免 fetchTargetIndex 混淆）
    const prevComponentInstance: Array<CreateComponentGroupType | CreateComponentType> = [];
    if (!isIsolation) {
      chartEditStore.getTargetChart.selectId.forEach((id) => {
        if (!targetMap.has(id)) return;
        const index = chartEditStore.fetchTargetIndex(id);
        const targetComponent = chartEditStore.getComponentList[index];
        // 组件已被移除时跳过历史快照记录
        if (!targetComponent) return;
        prevComponentInstance.push(cloneDeep(targetComponent));
      });
    }

    // 记录初始位置
    chartEditStore.setMousePosition(undefined, undefined, startX, startY);

    // 移动-计算偏移量
    const mousemove = throttle((moveEvent: MouseEvent) => {
      chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, true);
      chartEditStore.setMousePosition(moveEvent.screenX, moveEvent.screenY);

      // 当前偏移量，处理 scale 比例问题
      const offsetX = (moveEvent.screenX - startX) / scale;
      const offsetY = (moveEvent.screenY - startY) / scale;

      if (isIsolation && activeGroupId) {
        // 隔离模式：直接更新 groupList 内子元素位置，限制在 Group 边界内
        const groupIdx = chartEditStore.componentList.findIndex((e) => e.id === activeGroupId);
        if (groupIdx === -1) return;
        const group = chartEditStore.getComponentList[groupIdx] as CreateComponentGroupType;

        chartEditStore.getTargetChart.selectId.forEach((id) => {
          if (!targetMap.has(id)) return;
          const { x, y, w, h, groupW, groupH } = targetMap.get(id);
          const child = group.groupList.find((c) => c.id === id);
          if (!child) return;

          let currX = Math.round(x + offsetX);
          let currY = Math.round(y + offsetY);

          // 限制在 Group 外框范围内
          currX = Math.max(0, Math.min(currX, groupW - w));
          currY = Math.max(0, Math.min(currY, groupH - h));

          child.attr = Object.assign(child.attr, { x: currX, y: currY });
        });
      } else {
        chartEditStore.getTargetChart.selectId.forEach((id) => {
          if (!targetMap.has(id)) return;

          const index = chartEditStore.fetchTargetIndex(id);
          // 拿到初始位置数据
          const { x, y, w, h } = targetMap.get(id);
          const componentInstance = chartEditStore.getComponentList[index];

          let currX = Math.round(x + offsetX);
          let currY = Math.round(y + offsetY);

          // 要预留的距离
          const distance = 50;

          // 基于左上角位置检测
          currX = Math.max(currX, -w + distance);
          currY = Math.max(currY, -h + distance);

          // 基于右下角位置检测
          currX = Math.min(currX, canvasWidth - distance);
          currY = Math.min(currY, canvasHeight - distance);
          if (componentInstance) {
            componentInstance.attr = Object.assign(componentInstance.attr, {
              x: currX,
              y: currY,
            });
          }
        });
      }
    }, 20);

    const mouseup = () => {
      try {
        chartEditStore.setMousePosition(0, 0, 0, 0);
        chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, false);
        // 加入历史栈（仅非隔离模式）
        if (!isIsolation && prevComponentInstance.length > 0) {
          chartEditStore.getTargetChart.selectId.forEach((id) => {
            if (!targetMap.has(id)) return;
            const index = chartEditStore.fetchTargetIndex(id);
            const curComponentInstance = chartEditStore.getComponentList[index];
            // 组件已被移除时跳过该 id 的偏移回写，避免中断后续清理
            if (!curComponentInstance) return;
            // 找到记录的所选组件
            prevComponentInstance.forEach((preItem) => {
              if (preItem.id === id) {
                preItem.attr = Object.assign(preItem.attr, {
                  offsetX: curComponentInstance.attr.x - preItem.attr.x,
                  offsetY: curComponentInstance.attr.y - preItem.attr.y,
                });
              }
            });
          });

          const moveComponentInstance = prevComponentInstance.filter((item) => item.attr.offsetX !== 0 && item.attr.offsetY !== 0);
          moveComponentInstance.length > 0 && chartEditStore.moveComponentList(moveComponentInstance);
        }
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
      } catch (error) {
        console.warn(error);
      }
    };

    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', mouseup);
  };

  // * 进入事件
  const mouseenterHandle = (e: MouseEvent, item: CreateComponentGroupType | CreateComponentType) => {
    e.preventDefault();
    e.stopPropagation();
    if (!chartEditStore.getEditCanvas.isSelect) {
      chartEditStore.setTargetHoverChart(item.id);
    }
  };

  // * 移出事件
  const mouseleaveHandle = (e: MouseEvent, _item: CreateComponentGroupType | CreateComponentType) => {
    e.preventDefault();
    e.stopPropagation();
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, false);
    chartEditStore.setTargetHoverChart(undefined);
  };

  return { mouseClickHandle, mousedownHandle, mouseenterHandle, mouseleaveHandle };
};

// * 移动锚点
export const useMousePointHandle = (e: MouseEvent, point: string, item: CreateComponentGroupType | CreateComponentType) => {
  e.stopPropagation();
  e.preventDefault();

  const chartEditStore = useChartEditStore();
  const attr = item.attr;

  // 设置拖拽状态
  const scale = chartEditStore.getEditCanvas.scale;
  const editCanvas = chartEditStore.getEditCanvas;
  const isIsolationGroupResize = item.isGroup && editCanvas.isGroupIsolation && editCanvas.activeGroupId === item.id;

  const itemAttrX = attr.x;
  const itemAttrY = attr.y;
  const itemAttrW = attr.w;
  const itemAttrH = attr.h;
  const isolationGroupResizeState = isIsolationGroupResize
    ? (() => {
        const group = item as CreateComponentGroupType;
        const metrics = getGroupContentMetrics(group);
        const children = (group.groupList ?? []).map((child) => ({
          id: child.id,
          x: child.attr.x,
          y: child.attr.y,
          w: child.attr.w,
          h: child.attr.h,
        }));

        return {
          metrics,
          children,
          minChildDisplayX: children.length > 0 ? Math.min(...children.map((child) => child.x * metrics.scaleX)) : 0,
          minChildDisplayY: children.length > 0 ? Math.min(...children.map((child) => child.y * metrics.scaleY)) : 0,
          maxChildDisplayRight: children.length > 0 ? Math.max(...children.map((child) => (child.x + child.w) * metrics.scaleX)) : 0,
          maxChildDisplayBottom: children.length > 0 ? Math.max(...children.map((child) => (child.y + child.h) * metrics.scaleY)) : 0,
        };
      })()
    : null;

  // 记录点击初始位置
  const startX = e.screenX;
  const startY = e.screenY;

  // 记录初始位置
  chartEditStore.setMousePosition(startX, startY);
  let hasMoved = false;

  const mousemove = throttle((moveEvent: MouseEvent) => {
    if (!hasMoved) {
      hasMoved = true;
      chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, true);
    }
    chartEditStore.setMousePosition(moveEvent.screenX, moveEvent.screenY);

    const currX = Math.round((moveEvent.screenX - startX) / scale);
    const currY = Math.round((moveEvent.screenY - startY) / scale);

    const isTop = /t/.test(point);
    const isBottom = /b/.test(point);
    const isLeft = /l/.test(point);
    const isRight = /r/.test(point);

    const rawHeightDelta = isBottom ? currY : 0;
    const heightDelta = isTop ? -currY : rawHeightDelta;
    const newHeight = itemAttrH + heightDelta;
    const rawWidthDelta = isRight ? currX : 0;
    const widthDelta = isLeft ? -currX : rawWidthDelta;
    const newWidth = itemAttrW + widthDelta;

    if (isIsolationGroupResize) {
      const group = item as CreateComponentGroupType;
      const contentMetrics = isolationGroupResizeState!.metrics;
      const scaleX = contentMetrics.scaleX || 1;
      const scaleY = contentMetrics.scaleY || 1;

      let safeCurrX = currX;
      let safeCurrY = currY;

      if (isLeft) safeCurrX = Math.min(safeCurrX, isolationGroupResizeState!.minChildDisplayX);
      if (isTop) safeCurrY = Math.min(safeCurrY, isolationGroupResizeState!.minChildDisplayY);
      if (isRight) safeCurrX = Math.max(safeCurrX, isolationGroupResizeState!.maxChildDisplayRight - contentMetrics.contentWidth);
      if (isBottom) safeCurrY = Math.max(safeCurrY, isolationGroupResizeState!.maxChildDisplayBottom - contentMetrics.contentHeight);

      const safeWidthDelta = isLeft ? -safeCurrX : isRight ? safeCurrX : 0;
      const safeHeightDelta = isTop ? -safeCurrY : isBottom ? safeCurrY : 0;
      const nextContentWidth = Math.max(contentMetrics.contentWidth + safeWidthDelta, 0);
      const nextContentHeight = Math.max(contentMetrics.contentHeight + safeHeightDelta, 0);
      const nextAttrW = Math.max(nextContentWidth + contentMetrics.shellWidth, contentMetrics.shellWidth);
      const nextAttrH = Math.max(nextContentHeight + contentMetrics.shellHeight, contentMetrics.shellHeight);
      const shiftX = isLeft ? -safeCurrX / scaleX : 0;
      const shiftY = isTop ? -safeCurrY / scaleY : 0;

      group.attr.w = nextAttrW;
      group.attr.h = nextAttrH;
      group.attr.x = itemAttrX + (isLeft ? safeCurrX : 0);
      group.attr.y = itemAttrY + (isTop ? safeCurrY : 0);
      group.option.designWidth = scaleX > 0 ? Math.max(nextContentWidth / scaleX, 0) : contentMetrics.width;
      group.option.designHeight = scaleY > 0 ? Math.max(nextContentHeight / scaleY, 0) : contentMetrics.height;

      group.groupList.forEach((child) => {
        const snapshot = isolationGroupResizeState!.children.find((item) => item.id === child.id);
        if (!snapshot) return;
        child.attr.x = snapshot.x + shiftX;
        child.attr.y = snapshot.y + shiftY;
      });
      return;
    }

    attr.h = Math.max(newHeight, 0);
    attr.w = Math.max(newWidth, 0);
    attr.x = itemAttrX + (isLeft ? currX : 0);
    attr.y = itemAttrY + (isTop ? currY : 0);
  }, 50);

  const mouseup = () => {
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, false);
    chartEditStore.setMousePosition(0, 0, 0, 0);
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
  };

  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
};

type ConnectLineControlPointKey = 'endPoint' | 'startPoint' | `point-${number}`;

type ConnectLinePoint = { x?: number; y?: number };

type ConnectLineEditableOption = {
  endPoint?: ConnectLinePoint;
  pathType?: 'elbow' | 'roundedElbow' | 'straight';
  points?: ConnectLinePoint[];
  startPoint?: ConnectLinePoint;
};

type ConnectLineCreateConfig = ConfigType & {
  defaultPathType?: 'elbow' | 'roundedElbow' | 'straight';
};

type ConnectLineDraftState = {
  anchorPoint: { x: number; y: number };
  anchorScreenX: number;
  anchorScreenY: number;
  componentId: string;
  mousemove: ReturnType<typeof throttle>;
  pathType?: 'elbow' | 'roundedElbow' | 'straight';
};

const CONNECT_LINE_ENDPOINT_PADDING = 24;
let connectLineDraftState: ConnectLineDraftState | null = null;
let suppressNextConnectLineContextMenu = false;

const normalizeEndpoint = (point: ConnectLinePoint | undefined, attr: PickCreateComponentType<'attr'>) => ({
  x: Math.min(Math.max(Number(point?.x) || 0, 0), attr.w),
  y: Math.min(Math.max(Number(point?.y) || 0, 0), attr.h),
});

const toAbsoluteConnectLinePoints = (item: CreateComponentGroupType | CreateComponentType, option: ConnectLineEditableOption) => {
  if (option.points && option.points.length >= 2) {
    return option.points.map((point) => {
      const normalizedPoint = normalizeEndpoint(point, item.attr);
      return {
        x: item.attr.x + normalizedPoint.x,
        y: item.attr.y + normalizedPoint.y,
      };
    });
  }

  const startPoint = normalizeEndpoint(option.startPoint, item.attr);
  const endPoint = normalizeEndpoint(option.endPoint, item.attr);
  return [
    { x: item.attr.x + startPoint.x, y: item.attr.y + startPoint.y },
    { x: item.attr.x + endPoint.x, y: item.attr.y + endPoint.y },
  ];
};

const applyConnectLinePoints = (
  item: CreateComponentGroupType | CreateComponentType,
  option: ConnectLineEditableOption,
  points: Array<{ x: number; y: number }>,
) => {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues);
  const minY = Math.min(...yValues);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);

  item.attr.x = minX - CONNECT_LINE_ENDPOINT_PADDING;
  item.attr.y = minY - CONNECT_LINE_ENDPOINT_PADDING;
  item.attr.w = Math.max(maxX - minX, 1) + CONNECT_LINE_ENDPOINT_PADDING * 2;
  item.attr.h = Math.max(maxY - minY, 1) + CONNECT_LINE_ENDPOINT_PADDING * 2;

  option.points = points.map((point) => ({
    x: point.x - item.attr.x,
    y: point.y - item.attr.y,
  }));
  option.startPoint = option.points[0];
  option.endPoint = option.points[option.points.length - 1];
};

const areSameConnectLinePoint = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;

const getConnectLineDraftComponent = (chartEditStore: ReturnType<typeof useChartEditStore>) => {
  if (!connectLineDraftState) return null;
  const index = chartEditStore.fetchTargetIndex(connectLineDraftState.componentId);
  if (index === -1) return null;
  return chartEditStore.getComponentList[index] as CreateComponentType;
};

const stopConnectLinePreview = () => {
  if (!connectLineDraftState) return;
  document.removeEventListener('mousemove', connectLineDraftState.mousemove);
  connectLineDraftState.mousemove.cancel?.();
  connectLineDraftState = null;
};

const exitConnectLineDrawMode = (chartEditStore: ReturnType<typeof useChartEditStore>) => {
  stopConnectLinePreview();
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, false);
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.CREATE_COMPONENT_CONFIG, null);
  chartEditStore.setMousePosition(0, 0, 0, 0);
};

const beginConnectLinePreview = (
  chartEditStore: ReturnType<typeof useChartEditStore>,
  component: CreateComponentType,
  anchorPoint: { x: number; y: number },
  anchorScreenX: number,
  anchorScreenY: number,
  pathType?: 'elbow' | 'roundedElbow' | 'straight',
) => {
  stopConnectLinePreview();
  let hasMoved = false;
  const mousemove = throttle((moveEvent: MouseEvent) => {
    const draftComponent = getConnectLineDraftComponent(chartEditStore);
    if (!draftComponent) return;

    const draftOption = draftComponent.option as ConnectLineEditableOption;
    const points = toAbsoluteConnectLinePoints(draftComponent, draftOption);
    points[points.length - 1] = {
      x: Math.round(anchorPoint.x + (moveEvent.screenX - anchorScreenX) / chartEditStore.getEditCanvas.scale),
      y: Math.round(anchorPoint.y + (moveEvent.screenY - anchorScreenY) / chartEditStore.getEditCanvas.scale),
    };

    if (!hasMoved) {
      hasMoved = true;
      chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, true);
    }
    chartEditStore.setMousePosition(moveEvent.screenX, moveEvent.screenY);
    applyConnectLinePoints(draftComponent, draftOption, points);
  }, 16);

  connectLineDraftState = {
    anchorPoint,
    anchorScreenX,
    anchorScreenY,
    componentId: component.id,
    mousemove,
    pathType,
  };
  document.addEventListener('mousemove', mousemove);
};

const finishConnectLineDraw = (chartEditStore: ReturnType<typeof useChartEditStore>, discardPreviewPoint = false) => {
  const draftComponent = getConnectLineDraftComponent(chartEditStore);

  if (draftComponent) {
    const draftOption = draftComponent.option as ConnectLineEditableOption;
    let points = toAbsoluteConnectLinePoints(draftComponent, draftOption);

    if (discardPreviewPoint && points.length >= 2) {
      points = points.slice(0, -1);
    }

    if (points.length >= 2) {
      const lastPoint = points[points.length - 1];
      const prevPoint = points[points.length - 2];
      // length>=2 已保证末尾两点存在，此处守卫仅为类型收窄
      if (lastPoint && prevPoint && areSameConnectLinePoint(lastPoint, prevPoint)) {
        points = points.slice(0, -1);
      }
    }

    const firstPoint = points[0];
    if (points.length < 2 || (firstPoint && points.every((point) => areSameConnectLinePoint(point, firstPoint)))) {
      chartEditStore.removeComponentList(draftComponent.id, false);
    } else {
      applyConnectLinePoints(draftComponent, draftOption, points);
      chartEditStore.setTargetSelectChart(draftComponent.id);
    }
  }

  exitConnectLineDrawMode(chartEditStore);
};

const markConnectLineContextMenuConsumed = () => {
  suppressNextConnectLineContextMenu = true;
};

export const consumeConnectLineContextMenu = (e: MouseEvent) => {
  const chartEditStore = useChartEditStore();
  const isConnectLineDrawing = chartEditStore.getEditCanvas.isCreate && chartEditStore.getEditCanvas.createComponentConfig?.key === 'ConnectLine';

  if (!isConnectLineDrawing && !suppressNextConnectLineContextMenu) return false;

  suppressNextConnectLineContextMenu = false;
  e.preventDefault();
  e.stopPropagation();
  return true;
};

export const startConnectLineAppendMode = (e: MouseEvent, pointKey: ConnectLineControlPointKey, item: CreateComponentGroupType | CreateComponentType) => {
  const chartEditStore = useChartEditStore();
  const option = item.option as ConnectLineEditableOption;
  const points = toAbsoluteConnectLinePoints(item, option);
  const pointIndex = resolveConnectLinePointIndex(pointKey, points);

  if (pointIndex !== points.length - 1) return;

  e.preventDefault();
  e.stopPropagation();

  if (connectLineDraftState && connectLineDraftState.componentId === item.id) return;

  if (connectLineDraftState) {
    finishConnectLineDraw(chartEditStore, true);
  }

  const anchorPoint = points[pointIndex];
  // pointIndex 已校验为有效末尾索引，正常路径必有点位；缺失时跳过防止空数据崩溃
  if (!anchorPoint) return;
  applyConnectLinePoints(item, option, [...points, anchorPoint]);
  chartEditStore.setTargetSelectChart(item.id);
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.CREATE_COMPONENT_CONFIG, item.chartConfig);
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, true);
  beginConnectLinePreview(chartEditStore, item as CreateComponentType, anchorPoint, e.screenX, e.screenY, option.pathType);
};

const resolveConnectLinePointIndex = (pointKey: ConnectLineControlPointKey, points: Array<{ x: number; y: number }>) => {
  if (pointKey === 'startPoint') return 0;
  if (pointKey === 'endPoint') return points.length - 1;
  return Number(pointKey.replace('point-', ''));
};

export const useMouseConnectLinePointHandle = (e: MouseEvent, pointKey: ConnectLineControlPointKey, item: CreateComponentGroupType | CreateComponentType) => {
  e.stopPropagation();
  e.preventDefault();

  const chartEditStore = useChartEditStore();
  const scale = chartEditStore.getEditCanvas.scale;
  const option = item.option as ConnectLineEditableOption;
  const initialPoints = toAbsoluteConnectLinePoints(item, option);
  const pointIndex = resolveConnectLinePointIndex(pointKey, initialPoints);
  const movingStartPoint = initialPoints[pointIndex] ?? initialPoints[0];
  const startX = e.screenX;
  const startY = e.screenY;

  chartEditStore.setMousePosition(startX, startY);
  let hasMoved = false;

  // 连接线无可用点位时跳过控制点拖拽监听注册，避免拖动过程崩溃
  if (!movingStartPoint) return;

  const mousemove = throttle((moveEvent: MouseEvent) => {
    if (!hasMoved) {
      hasMoved = true;
      chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, true);
    }
    chartEditStore.setMousePosition(moveEvent.screenX, moveEvent.screenY);

    const movingPoint = {
      x: Math.round(movingStartPoint.x + (moveEvent.screenX - startX) / scale),
      y: Math.round(movingStartPoint.y + (moveEvent.screenY - startY) / scale),
    };

    const nextPoints = initialPoints.map((point, index) => (index === pointIndex ? movingPoint : point));
    applyConnectLinePoints(item, option, nextPoints);
  }, 20);

  const mouseup = () => {
    chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_DRAG, false);
    chartEditStore.setMousePosition(0, 0, 0, 0);
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
  };

  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
};
