import { computed, onMounted, ref } from 'vue';
import { ThingsApi } from '@vben/api';
import { extractList } from '#/utils/api-response';
import { buildAreaTree } from '#/utils/area-tree';
export type GroupType = 'groupBuildingIDs' | 'areaID';

export interface EnergyTreeNode {
  key: string;
  label: string;
  value: string;
  idPath?: string;
  children?: EnergyTreeNode[];
}

/** 将 GroupInfo 树转换为 EnergyTreeNode */
function convertGroupToTreeNode(group: any): EnergyTreeNode {
  const children = group.children?.map(convertGroupToTreeNode) ?? [];
  return {
    key: group.id ?? '',
    label: group.name ?? '',
    value: group.id ?? '',
    idPath: group.idPath,
    ...(children.length > 0 ? { children } : {}),
  };
}

/** 将 AreaInfo 树转换为 EnergyTreeNode */
function convertAreaToTreeNode(area: any): EnergyTreeNode {
  const children = area.children?.map(convertAreaToTreeNode) ?? [];
  return {
    key: area.areaID ?? '',
    label: area.areaName ?? '',
    value: area.areaID ?? '',
    idPath: area.areaIDPath,
    ...(children.length > 0 ? { children } : {}),
  };
}

/** 递归拍平树形结构 */
export function flattenTree(nodes: EnergyTreeNode[]): EnergyTreeNode[] {
  const result: EnergyTreeNode[] = [];
  const traverse = (list: EnergyTreeNode[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return result;
}

/** 从搜索值过滤树节点（只过滤叶子节点，但保留父路径） */
function filterTree(nodes: EnergyTreeNode[], search: string): EnergyTreeNode[] {
  if (!search) return nodes;
  const result: EnergyTreeNode[] = [];
  for (const node of nodes) {
    const filteredChildren = filterTree(node.children ?? [], search);
    if (node.label.includes(search) || filteredChildren.length > 0) {
      result.push({
        ...node,
        ...(filteredChildren.length > 0 ? { children: filteredChildren } : { children: undefined }),
      });
    }
  }
  return result;
}

/**
 * 能源树形选择器数据 Hook
 * 管理建筑分组 / 区域的树形数据加载与选中状态
 */
export function useEnergyTree() {
  const groupType = ref<GroupType>('areaID');
  const searchValue = ref('');

  const groupData = ref<any>(null);
  const areaData = ref<any>(null);
  const isGroupLoading = ref(false);
  const isAreaLoading = ref(false);

  async function loadGroupData() {
    isGroupLoading.value = true;
    try {
      groupData.value = await ThingsApi.postApiV1ThingsGroupInfoGetList({ purpose: 'building' });
    } catch (e) {
      console.error('加载建筑分组失败:', e);
    } finally {
      isGroupLoading.value = false;
    }
  }

  async function loadAreaData() {
    isAreaLoading.value = true;
    try {
      areaData.value = await ThingsApi.postApiV1ThingsAreaInfoGetList({});
    } catch (e) {
      console.error('加载区域数据失败:', e);
    } finally {
      isAreaLoading.value = false;
    }
  }

  async function refresh() {
    await Promise.all([loadGroupData(), loadAreaData()]);
  }

  onMounted(() => {
    refresh();
  });

  const isLoading = computed(() => isGroupLoading.value || isAreaLoading.value);

  const isReady = computed(
    () => !!(groupData.value != null || areaData.value != null),
  );

  const rawTreeData = computed<EnergyTreeNode[]>(() => {
    if (groupType.value === 'groupBuildingIDs') {
      const list = extractList(groupData.value);
      return list.map(convertGroupToTreeNode);
    } else {
      const list = extractList(areaData.value);
      const tree = buildAreaTree(list);
      return tree.map(convertAreaToTreeNode);
    }
  });

  const treeData = computed<EnergyTreeNode[]>(() => {
    return filterTree(rawTreeData.value, searchValue.value);
  });

  const flatData = computed(() => flattenTree(rawTreeData.value));

  /** 默认选中第一个根节点的 key */
  const defaultKey = computed<string | null>(() => {
    const first = rawTreeData.value[0];
    return first?.key ?? null;
  });

  /**
   * 根据 groupType 和选中的 id 列表，生成 API 请求参数
   * - 区域: { partitionBy: "areaID", areaIDs: ids }
   * - 建筑分组: { partitionBy: "groupBuildingIDs", belongGroup: { building: { ids } } }
   */
  function getFilterParams(
    checkedIds: string[],
    type?: GroupType,
  ): Record<string, unknown> {
    const t = type ?? groupType.value;
    if (!checkedIds.length) return {};

    if (t === 'areaID') {
      return {
        partitionBy: 'areaID',
        areaIDs: checkedIds,
      };
    } else {
      return {
        partitionBy: 'groupBuildingIDs',
        belongGroup: {
          building: { ids: checkedIds },
        },
      };
    }
  }

  return {
    groupType,
    searchValue,
    treeData,
    flatData,
    isLoading,
    isReady,
    defaultKey,
    getFilterParams,
    refresh,
  };
}
