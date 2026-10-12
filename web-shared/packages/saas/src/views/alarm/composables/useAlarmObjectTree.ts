/**
 * 文件说明：告警 V2 对象树真实 API 加载
 * 负责把后端的品类、产品、区域、分组、设备列表组装成前端告警对象树，
 * 供 StepBasic.vue 的告警来源选择与告警对象选择使用。
 */
import { ref } from 'vue';
import { ThingsApi } from '@vben/api';

import type { AlarmObjectNode } from '../types/alarm-v2.types';

// 类型从 ThingsApi 命名空间引用（@vben/api 顶层不导出 things-api 模型，共享包内统一用命名空间类型）

/** 通用分页参数：尽量一次性拉取全部 */
const ALL_PAGE = { page: 1, size: 999 };

/** 按 key 对列表分组 */
function groupBy<T>(list: T[], keyFn: (item: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of list) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

/** 深拷贝区域树，便于把不同产品的设备分别挂载到各自区域副本下 */
function cloneAreaTree(nodes?: AlarmObjectNode[]): AlarmObjectNode[] {
  return (nodes ?? []).map((node) => ({
    ...node,
    children: cloneAreaTree(node.children),
  }));
}

/** findAlarmObjectNodeById 在对象树中按 ID 和可选层级查找节点。 */
export function findAlarmObjectNodeById(nodes: AlarmObjectNode[], id: string, level?: AlarmObjectNode['level']): AlarmObjectNode | null {
  for (const node of nodes) {
    if (node.id === id && (!level || node.level === level)) return node;
    if (node.children) {
      const found = findAlarmObjectNodeById(node.children, id, level);
      if (found) return found;
    }
  }
  return null;
}

/** collectAlarmObjectNodesByLevel 收集节点及其后代中指定层级的节点副本。 */
function collectAlarmObjectNodesByLevel(
  node: AlarmObjectNode,
  level: AlarmObjectNode['level'],
): AlarmObjectNode[] {
  /** 当前节点命中时只保留自身字段，避免把区域等无关中间层继续带入选择树。 */
  const matches = node.level === level ? [{ ...node, children: undefined }] : [];
  return [
    ...matches,
    ...(node.children ?? []).flatMap((child) =>
      collectAlarmObjectNodesByLevel(child, level),
    ),
  ];
}

/** buildProductDeviceGroups 递归生成包含设备的产品分组。 */
function buildProductDeviceGroups(node: AlarmObjectNode): AlarmObjectNode[] {
  if (node.level === 'product') {
    /** 产品分组中的设备统一提升为直接子节点，避免区域层级阻断设备选择。 */
    const devices = collectAlarmObjectNodesByLevel(node, 'device');
    return devices.length > 0
      ? [{ ...node, children: devices }]
      : [];
  }
  return (node.children ?? []).flatMap(buildProductDeviceGroups);
}

/** buildDeviceSelectionTree 生成指定设备选择树，隐藏空产品并消除区域等中间层级。 */
export function buildDeviceSelectionTree(
  source: AlarmObjectNode,
): AlarmObjectNode[] {
  if (source.level === 'product') {
    return collectAlarmObjectNodesByLevel(source, 'device');
  }
  return buildProductDeviceGroups(source);
}

/** cloneAreaSelectionNodes 仅保留区域节点，避免把设备混入区域选择结果。 */
function cloneAreaSelectionNodes(nodes: AlarmObjectNode[]): AlarmObjectNode[] {
  return nodes
    .filter((node) => node.level === 'area')
    .map((node) => {
      const children = cloneAreaSelectionNodes(node.children ?? []);
      return {
        ...node,
        children: children.length > 0 ? children : undefined,
      };
    });
}

/** findFirstProductNode 查找来源树中的首个产品节点。 */
function findFirstProductNode(node: AlarmObjectNode): AlarmObjectNode | null {
  if (node.level === 'product') return node;
  for (const child of node.children ?? []) {
    const product = findFirstProductNode(child);
    if (product) return product;
  }
  return null;
}

/** buildAreaSelectionTree 生成仅包含区域层级的选择树。 */
export function buildAreaSelectionTree(
  source: AlarmObjectNode,
): AlarmObjectNode[] {
  const product = findFirstProductNode(source);
  return product
    ? cloneAreaSelectionNodes(product.children ?? [])
    : [];
}

/** buildGroupSelectionTree 生成指定分组选择树，并隐藏没有分组的产品。 */
export function buildGroupSelectionTree(
  source: AlarmObjectNode,
): AlarmObjectNode[] {
  if (source.level === 'product') {
    return collectAlarmObjectNodesByLevel(source, 'group');
  }

  return (source.children ?? []).flatMap((child) => {
    if (child.level === 'product') {
      const groups = collectAlarmObjectNodesByLevel(child, 'group');
      return groups.length > 0
        ? [{ ...child, children: groups }]
        : [];
    }
    return buildGroupSelectionTree(child);
  });
}

/** filterDeviceSelectionTree 按设备名称或标识筛选指定设备选择树。 */
export function filterDeviceSelectionTree(
  nodes: AlarmObjectNode[],
  keyword: string,
): AlarmObjectNode[] {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  if (!normalizedKeyword) return nodes;

  return nodes.flatMap((node) => {
    if (node.level === 'device') {
      const matched =
        node.name.toLocaleLowerCase().includes(normalizedKeyword)
        || node.id.toLocaleLowerCase().includes(normalizedKeyword);
      return matched ? [node] : [];
    }

    const children = filterDeviceSelectionTree(
      node.children ?? [],
      normalizedKeyword,
    );
    return children.length > 0
      ? [{ ...node, children }]
      : [];
  });
}

/** getAlarmTargetDisplay 返回告警目标的可读名称，优先使用后端快照。 */
export function getAlarmTargetDisplay(target: ThingsApi.AlarmTarget | undefined, nodes: AlarmObjectNode[], targetName?: string): string {
  if (targetName?.trim()) return targetName;
  if (target?.categoryID) {
    return findAlarmObjectNodeById(nodes, target.categoryID, 'category')?.name ?? `品类 ${target.categoryID}`;
  }
  if (target?.productID) {
    return findAlarmObjectNodeById(nodes, target.productID, 'product')?.name ?? `产品 ${target.productID}`;
  }
  return '-';
}

/** 把后端区域列表构建成前端区域树 */
function buildAreaTree(areas: ThingsApi.AreaInfo[]): AlarmObjectNode[] {
  const roots = areas.filter((a) => !a.parentAreaID);
  function build(area: ThingsApi.AreaInfo): AlarmObjectNode {
    const children = areas
      .filter((a) => a.parentAreaID === area.areaID)
      .map(build);
    return {
      id: area.areaID!,
      name: area.areaName!,
      level: 'area',
      levelName: '区域',
      children: children.length ? children : undefined,
    };
  }
  return roots.map(build);
}

/** 把后端数据组装成前端告警对象树：品类 -> 产品 -> [区域 -> 设备, 分组] */
export function toAlarmObjectTree(
  categories: ThingsApi.ProductCategory[],
  products: ThingsApi.ProductInfo[],
  areas: ThingsApi.AreaInfo[],
  groups: ThingsApi.GroupInfo[],
  devices: ThingsApi.DeviceInfo[],
): AlarmObjectNode[] {
  const areaTree = buildAreaTree(areas);
  const devicesByProduct = groupBy(devices, (d) => d.productID);
  const groupsByProduct = groupBy(groups, (g) => g.productID);
  const productsByCategory = groupBy(products, (p) => p.categoryID);

  const categoryMap = new Map(categories.map((c) => [c.id!, c]));

  function buildCategoryTree(cats: ThingsApi.ProductCategory[]): AlarmObjectNode[] {
    return cats.map((cat) => {
      const productNodes =
        productsByCategory
          .get(cat.id!)
          ?.map((product) => buildProductNode(product)) ?? [];
      // 后端可能返回扁平品类列表，按 parentID 递归挂载子品类
      const children = categories.filter((c) => c.parentID === cat.id);
      const categoryNodes = buildCategoryTree(children);
      return {
        id: cat.id!,
        name: cat.name!,
        level: 'category',
        levelName: '品类',
        children: [...productNodes, ...categoryNodes],
      };
    });
  }

  function buildProductNode(product: ThingsApi.ProductInfo): AlarmObjectNode {
    const productDevices = devicesByProduct.get(product.productID!) ?? [];
    const productGroups = groupsByProduct.get(product.productID!) ?? [];
    const directDeviceNodes: AlarmObjectNode[] = [];

    // 复制全局区域树，并把该产品下的设备按区域挂载
    const productAreaTree = cloneAreaTree(areaTree);
    for (const device of productDevices) {
      const areaNode = device.areaID ? findAlarmObjectNodeById(productAreaTree, device.areaID) : null;
      if (areaNode) {
        areaNode.children = areaNode.children ?? [];
        areaNode.children.push({
          id: device.deviceName,
          name: device.deviceAlias || device.deviceName,
          level: 'device',
          levelName: '设备',
        });
      } else {
        // 默认区域或历史区域不在当前区域树时，仍需保留设备供告警规则直接选择。
        directDeviceNodes.push({
          id: device.deviceName,
          name: device.deviceAlias || device.deviceName,
          level: 'device',
          levelName: '设备',
        });
      }
    }

    const groupNodes = productGroups.map((group) => ({
      id: group.id!,
      name: group.name!,
      level: 'group',
      levelName: '分组',
    }));

    return {
      id: product.productID!,
      name: product.productName!,
      level: 'product',
      levelName: '产品',
      children: [...productAreaTree, ...directDeviceNodes, ...groupNodes],
    };
  }

  // 根品类：parentID 为空或父品类不在当前返回列表中（后端可能只返回子树）
  const rootCategories = categories.filter(
    (c) => !c.parentID || !categoryMap.has(c.parentID),
  );
  // 拍平品类层级：来源树直接展示产品节点（品类仅用于组织产品，不作为选择层级，
  // 避免"其他"等品类干扰选择——结构监测场景品类无业务含义）
  return buildCategoryTree(rootCategories).flatMap(
    (node) => node.children ?? [],
  );
}

/** useAlarmObjectTree 加载后端真实告警对象树。 */
export function useAlarmObjectTree() {
  const loading = ref(false);
  const error = ref('');
  const treeData = ref<AlarmObjectNode[]>([]);

  /** loadSources 仅加载品类和产品，供列表页解析告警来源名称。 */
  async function loadSources() {
    loading.value = true;
    error.value = '';
    try {
      const [categoryResp, productResp] = await Promise.all([
        ThingsApi.postApiV1ThingsProductCategoryGetList({ page: ALL_PAGE }),
        ThingsApi.postApiV1ThingsProductInfoGetList({ page: ALL_PAGE }),
      ]);
      const categories = categoryResp.list ?? [];
      const products = productResp.list ?? [];
      if (categories.length === 0 || products.length === 0) {
        throw new Error('后端告警来源数据为空');
      }
      treeData.value = toAlarmObjectTree(categories, products, [], [], []);
    } catch (error_: any) {
      error.value = error_?.message ?? '加载告警来源失败';
      console.error('[useAlarmObjectTree]', error.value, error_);
    } finally {
      loading.value = false;
    }
  }

  /** 异步加载对象树；失败或数据为空时保留空树并记录错误。 */
  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const [categoryResp, productResp, areaResp, groupResp, deviceResp] = await Promise.all([
        ThingsApi.postApiV1ThingsProductCategoryGetList({ page: ALL_PAGE }),
        ThingsApi.postApiV1ThingsProductInfoGetList({ page: ALL_PAGE }),
        ThingsApi.postApiV1ThingsAreaInfoGetList({ page: ALL_PAGE }),
        ThingsApi.postApiV1ThingsGroupInfoGetList({ page: ALL_PAGE }),
        ThingsApi.postApiV1ThingsDeviceInfoGetList({ page: ALL_PAGE }),
      ]);

      const categories = categoryResp.list ?? [];
      const products = productResp.list ?? [];
      const areas = areaResp.list ?? [];
      const groups = groupResp.list ?? [];
      const devices = deviceResp.list ?? [];

      if (!categories.length || !products.length) {
        throw new Error('后端对象树数据为空');
      }

      treeData.value = toAlarmObjectTree(categories, products, areas, groups, devices);
    } catch (error_: any) {
      treeData.value = [];
      error.value = error_?.message ?? '加载告警对象树失败';
      console.error('[useAlarmObjectTree]', error.value, error_);
    } finally {
      loading.value = false;
    }
  }

  return { treeData, loading, error, load, loadSources };
}
