/** 文件说明：后台嵌入 GoView 的挂载、语言与主题同步及生命周期回收。 */
import type { App as VueApp } from 'vue';

import { createApp, watch } from 'vue';

import { i18n as hostI18n } from '@vben/saas/locales';
import { preferences } from '@vben/preferences';
import { useAccessStore, useTabbarStore } from '@vben/stores';

import lineMdIcons from '@iconify/json/json/line-md.json';
import uimIcons from '@iconify/json/json/uim.json';
import wiIcons from '@iconify/json/json/wi.json';
import { addCollection } from 'iconify-icon';
import { getActivePinia } from 'pinia';

import { post } from '../goview/api/http';
import GoviewApp from '../goview/App.vue';
import { GoAppProvider } from '../goview/components/GoAppProvider/index';
import { StorageEnum } from '../goview/enums/storageEnum';
import i18n, { syncGoviewLocale } from '../goview/i18n';
import { initFunction, setupCustomComponents, setupDirectives, setupNaive } from '../goview/plugins';
import router, { setupRouter } from '../goview/router';
import { setupStore } from '../goview/store';
import { useChartEditStore } from '../goview/store/modules/chartEditStore/chartEditStore';
import { useChartHistoryStore } from '../goview/store/modules/chartHistoryStore/chartHistoryStore';
import { useChartLayoutStore } from '../goview/store/modules/chartLayoutStore/chartLayoutStore';
import { ChartLayoutStoreEnum } from '../goview/store/modules/chartLayoutStore/chartLayoutStore.type';
import { useDesignStore } from '../goview/store/modules/designStore/designStore';
import { ThemeEnum } from '../goview/enums/styleEnum';
import { getUUID, setHtmlTheme, setSessionStorage } from '../goview/utils';
import { setGoviewApp } from '../goview/utils/appInstance';
import { useSync } from '../goview/views/chart/hooks/useSync.hook';
import { restoreAccessTokenFromCookie } from '../shared/auth';
import { syncStandaloneContext } from '../views/bigscreen/shared/standalone-context';

import '../goview/styles/pages/index.scss';
import 'animate.css/animate.min.css';
import 'vue3-sketch-ruler/lib/style.css';

type GoviewMode = 'component' | 'edit' | 'preview';

type MountedGoview = {
  app: VueApp;
  navigateTo: (id: string, mode?: GoviewMode) => Promise<void>;
  providerApp: VueApp;
  unmount: () => void;
};

addCollection(uimIcons);
addCollection(lineMdIcons);
addCollection(wiIcons);

let mounted: MountedGoview | null = null;
const mountedInstanceMap = new WeakMap<HTMLElement, MountedGoview>();
let overflowRestoreList: Array<{ el: HTMLElement; original: string }> = [];
let stopThemeSync: (() => void) | null = null;

function lockAncestorOverflow(el: HTMLElement) {
  overflowRestoreList = [];
  let node = el.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const oy = style.overflowY;
    if (oy === 'auto' || oy === 'scroll') {
      overflowRestoreList.push({ el: node, original: node.style.overflowY });
      node.style.overflowY = 'hidden';
    }
    if (style.overflow === 'hidden' && node.classList.contains('flex')) {
      break;
    }
    node = node.parentElement;
  }
}

function restoreAncestorOverflow() {
  for (const { el, original } of overflowRestoreList) {
    el.style.overflowY = original;
  }
  overflowRestoreList = [];
}

function clearContainer(container: HTMLElement) {
  container.replaceChildren();
}

function normalizeComponentEntry(component: any) {
  if (!component || typeof component !== 'object') {
    return null;
  }

  return {
    ...component,
    attr: {
      w: component.attr?.w ?? 400,
      h: component.attr?.h ?? 300,
      x: component.attr?.x ?? 0,
      y: component.attr?.y ?? 0,
      offsetX: component.attr?.offsetX ?? 0,
      offsetY: component.attr?.offsetY ?? 0,
      zIndex: component.attr?.zIndex ?? -1,
    },
    chartConfig: component.chartConfig ?? {},
    events: component.events ?? { baseEvent: {}, advancedEvents: {}, interactEvents: [] },
    option: component.option ?? {},
    request: component.request ?? {},
    status: component.status ?? { lock: false, hide: false },
  };
}

function isEmptyComponentTemplate(content: any) {
  if (!content || typeof content !== 'object') {
    return true;
  }

  if (Array.isArray(content)) {
    return content.length === 0;
  }

  return Object.keys(content).length === 0;
}

function resolveComponentTemplate(content: any) {
  let templateContent = content;
  if (typeof templateContent === 'string' && templateContent.trim()) {
    try {
      templateContent = JSON.parse(templateContent);
    } catch {
      // keep original value; unsupported string content will fall through below
    }
  }
  templateContent = templateContent && typeof templateContent === 'object' ? templateContent : {};

  const isWrappedSingle = templateContent.type === 'single_template' && templateContent.component;
  const isWrappedGroup = templateContent.type === 'group_template';
  const isLegacyGroup = Array.isArray(templateContent.groupList);
  const isLegacySingle = !!templateContent.chartConfig || !!templateContent.attr || !!templateContent.option;
  const firstComponent = Array.isArray(templateContent.componentList) ? templateContent.componentList[0] : null;
  const isChartStorageGroup = !!firstComponent?.isGroup || Array.isArray(firstComponent?.groupList);
  const isChartStorageSingle = !!firstComponent?.chartConfig || !!firstComponent?.attr || !!firstComponent?.option;

  if (isWrappedGroup || isLegacyGroup) {
    return {
      category: templateContent.category || templateContent.chartConfig?.category || 'custom',
      componentEntry: reconstructGroup(templateContent),
      isGroup: true,
    };
  }

  if (isChartStorageGroup) {
    return {
      category: templateContent.category || firstComponent?.chartConfig?.category || 'custom',
      componentEntry: reconstructGroup(firstComponent),
      isGroup: true,
    };
  }

  let rawComponent = null;
  if (isWrappedSingle) {
    rawComponent = templateContent.component;
  } else if (templateContent.component && typeof templateContent.component === 'object') {
    rawComponent = templateContent.component;
  } else if (isLegacySingle) {
    rawComponent = templateContent;
  } else if (isChartStorageSingle) {
    rawComponent = firstComponent;
  }

  const componentEntry = normalizeComponentEntry(rawComponent);
  if (!componentEntry) {
    throw new Error('Invalid component template content');
  }

  return {
    category: templateContent.category || componentEntry.chartConfig?.category || 'custom',
    componentEntry,
    isGroup: false,
  };
}

function ensureRoot(container: HTMLElement) {
  clearContainer(container);
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  const provider = document.createElement('div');
  provider.dataset.goviewAppProvider = 'true';
  provider.style.display = 'none';

  const app = document.createElement('div');
  app.dataset.goviewApp = 'true';

  container.append(provider);
  container.append(app);

  return { appEl: app, providerEl: provider };
}

async function loadProjectData(id: string, published = false) {
  const accessStore = useAccessStore();
  if (!accessStore.accessToken) {
    const token = restoreAccessTokenFromCookie('Goview Host');
    if (token) accessStore.setAccessToken(token);
  }

  // 判断是否为已发布大屏访问（/view/ 路由），兼容 history 和 hash 两种路由模式；
  // published=true 时（如 org-park 嵌入已上架模板）同样按已发布语义处理
  const usePublished =
    published || window.location.pathname.includes('/view/') || window.location.hash.includes('/view/');
  const json: any = await post('/api/v1/view/project/detail/get-one', { id: String(id), forView: usePublished });
  if (json.code !== 200) {
    throw new Error(json.msg || 'Load project data failed');
  }

  const chartEditStore = useChartEditStore();
  const defaultData = chartEditStore.getStorageInfo();

  // 已发布语义：始终使用已发布快照（publishedContent），不走草稿；否则使用草稿内容（content）
  const rawSource = usePublished ? (json.data?.publishedContent || json.data?.content) : json.data?.content;
  let parsed: any = {};
  const rawContent = rawSource;
  if (typeof rawContent === 'string' && rawContent.trim()) {
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error('Invalid project content format');
    }
  }

  const projectData = {
    ...defaultData,
    ...parsed,
    editCanvasConfig: {
      ...defaultData.editCanvasConfig,
      ...parsed?.editCanvasConfig,
    },
    requestGlobalConfig: {
      ...defaultData.requestGlobalConfig,
      ...parsed?.requestGlobalConfig,
    },
    componentList: Array.isArray(parsed?.componentList) ? parsed.componentList : [...defaultData.componentList],
  };

  setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ ...projectData, id: String(id) }]);

  const { updateComponent } = useSync();
  await updateComponent(projectData, true, false);
}

/**
 * 加载组件模板数据到编辑器（组件编辑模式）
 * 1. 调用组件 API 获取模板 JSON
 * 2. 解析为 ChartEditStorage 格式
 * 3. 注入 chartEditStore 并标记 editorMode='component'
 * 4. 复位历史记录，确保"进入即纯净"
 */
async function loadComponentData(componentId: string) {
  const accessStore = useAccessStore();
  if (!accessStore.accessToken) {
    const token = restoreAccessTokenFromCookie('Goview Host');
    if (token) accessStore.setAccessToken(token);
  }

  const json: any = await post('/api/v1/view/component/get-one', { id: componentId });
  if (json.code !== 200) {
    throw new Error(json.msg || 'Load component data failed');
  }

  const template = json.data;
  const content = typeof template.content === 'string' && template.content.trim() ? JSON.parse(template.content) : template.content || {};

  const chartEditStore = useChartEditStore();
  const defaultData = chartEditStore.getStorageInfo();

  // 画布配置：保持 1920×1080 大屏尺寸，确保拖放区域完整可操作
  // 组件模式下不改变画布尺寸，仅修改 projectName 标识
  const CANVAS_W = defaultData.editCanvasConfig.width || 1920;
  const CANVAS_H = defaultData.editCanvasConfig.height || 1080;

  const templateCategory = template.categoryId || template.category || 'custom';
  const isEmptyTemplate = isEmptyComponentTemplate(content);
  let compId = '';
  let isGroup = false;
  let category = templateCategory;
  const componentList: any[] = [];

  if (!isEmptyTemplate) {
    const { category: resolvedCategory, componentEntry: resolvedEntry, isGroup: resolvedIsGroup } = resolveComponentTemplate(content);
    let componentEntry: any;

    isGroup = resolvedIsGroup;
    category = resolvedCategory || templateCategory;
    if (isGroup) {
      componentEntry = resolvedEntry;
      compId = getUUID();
      componentEntry.id = compId;
      // 居中显示
      componentEntry.attr.x = Math.round((CANVAS_W - componentEntry.attr.w) / 2);
      componentEntry.attr.y = Math.round((CANVAS_H - componentEntry.attr.h) / 2);
    } else {
      componentEntry = resolvedEntry;
      compId = getUUID();
      componentEntry.id = compId;
      const w = componentEntry.attr?.w || 400;
      const h = componentEntry.attr?.h || 300;
      componentEntry.attr.x = Math.round((CANVAS_W - w) / 2);
      componentEntry.attr.y = Math.round((CANVAS_H - h) / 2);
    }

    componentList.push(componentEntry);
  }

  const projectData = {
    ...defaultData,
    editCanvasConfig: {
      ...defaultData.editCanvasConfig,
      projectName: template.name || '未命名组件',
    },
    requestGlobalConfig: {
      ...defaultData.requestGlobalConfig,
    },
    componentList,
  };

  // 标记为组件编辑模式（editorMode 已在 mount 前预设，这里只补充 meta）
  chartEditStore.editCanvas.componentMeta = {
    id: String(componentId),
    name: template.name || '未命名组件',
    version: template.version,
    isGroup,
    category,
    thumbnail: content?.thumbnail || '',
  };

  // 加载数据
  const { updateComponent } = useSync();
  await updateComponent(projectData, true, false);

  // 自动选中组件，使右侧面板立即显示「定制」+「数据」tab
  if (compId) {
    chartEditStore.setTargetSelectChart(compId);
  } else {
    chartEditStore.setTargetSelectChart(undefined);
  }

  // 显式复位历史记录
  const chartHistoryStore = useChartHistoryStore();
  chartHistoryStore.clearBackStack();
  chartHistoryStore.clearForwardStack();
}

/**
 * 从 group_template JSON 还原为 Group 组件对象
 */
function reconstructGroup(content: any) {
  return {
    id: '',
    isGroup: true,
    groupList: content.groupList || [],
    attr: {
      w: content.attr?.w || 400,
      h: content.attr?.h || 300,
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: 0,
      zIndex: -1,
    },
    styles: content.styles || {},
    option: content.option || {},
    chartConfig: content.chartConfig || {},
    status: { lock: false, hide: false },
    events: { baseEvent: {}, advancedEvents: {}, interactEvents: [] },
  };
}

async function navigateTo(id: string, mode: GoviewMode = 'edit') {
  const encoded = encodeURIComponent(id);
  const target = mode === 'preview' ? `/chart/preview/${encoded}` : `/chart/home/${encoded}`;
  await router.replace(target);

  // 组件编辑模式：动态修改 tab 文案
  if (mode === 'component') {
    const chartEditStore = useChartEditStore();
    const meta = chartEditStore.editCanvas.componentMeta;
    const name = meta?.name || '组件';
    const version = meta?.version ? ` v${meta.version}` : '';
    const tabTitle = `组件编辑${name ? `: ${name}` : ''}${version}`;
    // 直接操作 Pinia store，避免 useTabs() 内部调用 inject() 报错
    // （navigateTo 在非 Vue setup 上下文中被调用）
    const tabbarStore = useTabbarStore();
    const currentTab = tabbarStore.getTabs.find((tab: any) => {
      return tab.path?.includes('/bigscreen/editor');
    });
    if (currentTab) {
      currentTab.meta.newTabTitle = tabTitle;
      await tabbarStore.updateCacheTabs();
    }
  }
}

function isHostDarkMode() {
  return preferences.theme.mode === 'dark' || (preferences.theme.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function syncGoviewThemeWithHost() {
  const darkMode = isHostDarkMode();
  const designStore = useDesignStore();
  designStore.darkTheme = darkMode;
  designStore.themeName = darkMode ? ThemeEnum.DARK : ThemeEnum.LIGHT;
  setHtmlTheme(darkMode ? 'dark' : 'light');
}

// 挂载互斥锁：mountGoview 全程串行化。
// 登录落地页（如「大屏」dashboard）与用户紧接着打开的目标页（如配电图）会并发
// 调用 mountGoview；若不串行化，两个调用会同时判定单例为空、各自创建 app 全量
// 挂载，共享的 router/pinia/appInstance 互相踩踏，最终后挂载页白屏或报
// "Goview app is not ready"。串行后后到调用能正确看到先到调用留下的单例并走
// 跨容器抢占逻辑。
let mountQueue: Promise<unknown> = Promise.resolve();

export function mountGoview(
  container: HTMLElement,
  id: string,
  mode: GoviewMode = 'edit',
  opts?: { published?: boolean },
): Promise<MountedGoview> {
  const run = mountQueue.then(() => doMountGoview(container, id, mode, opts));
  // 队列只负责排序，前一次的失败不应阻断后续挂载
  mountQueue = run.catch(() => {});
  return run;
}

async function doMountGoview(
  container: HTMLElement,
  id: string,
  mode: GoviewMode = 'edit',
  opts?: { published?: boolean },
): Promise<MountedGoview> {
  const loadData = mode === 'component' ? () => loadComponentData(id) : () => loadProjectData(id, opts?.published);

  if (mounted && mountedInstanceMap.get(container) === mounted) {
    // 同一容器复用（如编辑器内切换大屏）：清空旧数据，防止跨模式污染（project → component 或反向切换时）
    const chartEditStore = useChartEditStore();
    chartEditStore.resetForModeSwitch();
    const chartHistoryStore = useChartHistoryStore();
    chartHistoryStore.clearBackStack();
    chartHistoryStore.clearForwardStack();

    await loadData();
    await navigateTo(id, mode);
    return mounted;
  }

  if (mounted) {
    // 单例仍被其他容器占用（典型场景：tabbar keep-alive 缓存页持有实例，
    // 切换到本页面时旧页面并未卸载）。若不卸载旧实例直接复用，当前容器
    // 永远拿不到 app，页面空白且无任何报错，因此先卸载占用者再走全新挂载。
    try {
      mounted.unmount();
    } catch (error) {
      console.warn('[mountGoview] unmount previous instance failed', error);
    }
  }

  const { appEl, providerEl } = ensureRoot(container);

  const providerApp = createApp(GoAppProvider);
  const app = createApp(GoviewApp);

  setupNaive(app);
  setupDirectives(app);
  setupCustomComponents(app);
  const pinia = getActivePinia() as any;
  const hostPiniaApp = pinia?._a;
  setupStore(app, pinia);
  if (pinia && hostPiniaApp) {
    pinia._a = hostPiniaApp;
  }

  providerApp.mount(providerEl);

  setupRouter(app);
  // 宿主先完成资源加载，再同步语言，避免切换时回退到旧编辑器语言。
  syncGoviewLocale(hostI18n.global.locale.value, hostI18n.global.getLocaleMessage(hostI18n.global.locale.value));
  app.use(i18n);
  await navigateTo(id, mode);
  await router.isReady();
  syncStandaloneContext();
  syncGoviewThemeWithHost();
  stopThemeSync?.();
  const stopModeWatch = watch(
    () => preferences.theme.mode,
    () => {
      syncGoviewThemeWithHost();
    },
  );
  // 语言监听随挂载实例回收，不重建画布或清空未保存的业务内容。
  const stopLocaleWatch = watch(hostI18n.global.locale, (locale) => {
    syncGoviewLocale(locale, hostI18n.global.getLocaleMessage(locale));
  });
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = () => {
    if (preferences.theme.mode === 'auto') {
      syncGoviewThemeWithHost();
    }
  };
  media.addEventListener('change', handleMediaChange);
  stopThemeSync = () => {
    stopModeWatch();
    stopLocaleWatch();
    media.removeEventListener('change', handleMediaChange);
  };

  // 挂载前清理 Pinia 残留状态
  // 必须在数据加载之前重置，否则 loadProjectData 填充的 componentList 会被清空
  // （修复：重置提到数据加载前，避免预览页 F5 刷新后组件全部消失）
  const chartEditStore = useChartEditStore();
  chartEditStore.resetForModeSwitch();

  // 组件模式：在 mount 前预设 editorMode，否则大屏模式 resetForModeSwitch 已重置为 project
  if (mode === 'component') {
    chartEditStore.editCanvas.editorMode = 'component';
  }

  if (mode === 'preview') {
    let usedPreviewData = false;

    // 优先从 window.parent 全局 Map 读取封面截图传递的预览数据（无容量限制）
    try {
      const parentMap = (window.parent as any)?.__COVER_PREVIEW_DATA__ as
        | Map<string, Record<string, any>>
        | undefined;
      if (parentMap) {
        const coverData = parentMap.get(String(id));
        if (coverData && Date.now() - (coverData._previewTimestamp || 0) < 30_000) {
          const { _previewTimestamp: _ignored, ...projectData } = coverData;
          setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ ...projectData, id: String(id) }]);
          usedPreviewData = true;
        }
      }
    } catch {
      // 跨域或安全限制时忽略，回退到 localStorage
    }

    // 回退：从 localStorage 读取（常规预览按钮 / 新标签页场景）
    if (!usedPreviewData) {
      const previewStorageKey = `GO_PREVIEW_DATA_${id}`;
      const previewRaw = localStorage.getItem(previewStorageKey);
      if (previewRaw) {
        try {
          const previewData = JSON.parse(previewRaw);
          if (Date.now() - (previewData._previewTimestamp || 0) < 30_000) {
            const { _previewTimestamp: _ignored, ...projectData } = previewData;
            setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ ...projectData, id: String(id) }]);
            usedPreviewData = true;
          }
        } catch {
          // ignore invalid preview cache
        }
        localStorage.removeItem(previewStorageKey);
      }
    }

    if (!usedPreviewData) {
      await loadProjectData(id, opts?.published);
    }
  }

  setGoviewApp(app);
  app.mount(appEl);

  initFunction();

  if (mode === 'component') {
    try {
      await loadComponentData(id);
    } catch (error) {
      console.error('[ComponentMode] loadComponentData failed:', error);
      // 出错时清理加载状态，避免 loading 卡住
      try {
        const layoutStore = useChartLayoutStore();
        layoutStore.setItemUnHandle(ChartLayoutStoreEnum.PERCENTAGE, 0);
      } catch {
        /* ignore */
      }
      throw error;
    }
  } else if (mode !== 'preview') {
    await loadProjectData(id, opts?.published);
  }

  // 预览模式（仅 /preview/ 路由）：监听编辑器的实时同步
  // /view/ 路由是已发布大屏，不应实时更新，只有重新发布时才变化
  if (mode === 'preview' && window.location.pathname.includes('/preview/')) {
    const syncKey = `GO_REALTIME_SYNC_${id}`;
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key !== syncKey || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ ...parsed, id: String(id) }]);
        const chartEditStore = useChartEditStore();
        const { updateComponent } = useSync();
        updateComponent(parsed, true, false);
      } catch { /* ignore parse error */ }
    };
    window.addEventListener('storage', handleStorageSync);
    const cleanupKey = `_storage_cleanup_${id}`;
    (window as any)[cleanupKey] = () => window.removeEventListener('storage', handleStorageSync);
  }

  setTimeout(() => lockAncestorOverflow(container), 60);

  const instance: MountedGoview = {
    app,
    providerApp,
    unmount: () => {
      try {
        if (pinia && hostPiniaApp) {
          pinia._a = hostPiniaApp;
        }
        app.unmount();
      } finally {
        providerApp.unmount();
        clearContainer(container);
        mountedInstanceMap.delete(container);
        // 仅当本实例仍是当前单例时才清理共享状态：keep-alive 场景下单例会被
        // 其他嵌入页夺走，迟到的 stale unmount 若误清共享状态（主题同步、
        // goview 全局 app 引用、祖先 overflow 锁定）会击穿新占用者
        if (mounted === instance) {
          restoreAncestorOverflow();
          stopThemeSync?.();
          stopThemeSync = null;
          setGoviewApp(null);
          mounted = null;
        }
      }
    },
    navigateTo,
  };
  mounted = instance;
  mountedInstanceMap.set(container, mounted);

  return mounted;
}

export function getGoviewInstance(container: HTMLElement) {
  return mountedInstanceMap.get(container);
}
