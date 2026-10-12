/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type';

import { getRequestClient } from '@vben/api';
import { ImageConfig } from '@/packages/components/Informations/Mores/Image/index';
import { ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type';

import { usePackagesStore } from '@/store/modules/packagesStore/packagesStore';

import { ChatCategoryEnum, ChatCategoryEnumName } from '../index.type';

/** 资源库图片资源信息 */
interface AssetInfo {
  id?: string;
  name?: string;
  url?: string;
  type?: string;
  size?: number;
  groupId?: string;
}

/** 资源库列表响应 */
interface AssetListResponse {
  list: AssetInfo[];
  total: number;
}

/**
 * 资源库图片固定导出数组（供 Photos/index.ts spread 使用，保持模块导出类型不变）
 * 实际数据通过 loadLibraryPhotos() 异步写入 packagesStore.libraryPhotos，
 * 再由 useAside.hook.ts 的 computed 动态合并到渲染层
 */
const libraryPhotos: ConfigType[] = [];

/**
 * 从资源库 API 获取图片列表，映射为编辑器可拖拽的 ConfigType 数组
 * 数据写入 packagesStore.libraryPhotos，触发响应式更新
 * 若 API 调用失败或返回空列表，静默处理，不阻塞编辑器加载
 */
export async function loadLibraryPhotos() {
  const packagesStore = usePackagesStore();
  const requestClient = getRequestClient();
  try {
    const res = await requestClient.post<AssetListResponse>('/api/v1/view/asset/get-list', {
      type: 'image',
      page: { page: 1, size: 50 },
    });
    if (res?.list?.length) {
      packagesStore.setLibraryPhotos(
        res.list.map((asset) => ({
          ...ImageConfig,
          category: ChatCategoryEnum.LIBRARY,
          categoryName: ChatCategoryEnumName.LIBRARY,
          package: PackagesCategoryEnum.PHOTOS,
          chartFrame: ChartFrameEnum.STATIC,
          // 资源库图片必有 url，兜底空串仅为满足必填类型
          image: asset.url ?? '',
          dataset: asset.url ?? '',
          title: asset.name || editorT('orgManage.flow.unnamed'),
          redirectComponent: `${ImageConfig.package}/${ImageConfig.category}/${ImageConfig.key}`,
          // configEvents 运行时兼作资源库附加数据容器（拖入画布时回填到组件 option，
          // 见 ChartsItemBox/useDrag 的 assetId 提取逻辑），与 Function 事件签名不符，按实际契约断言
          configEvents: {
            assetId: asset.id,
            assetName: asset.name,
            assetSource: 'library',
          } as unknown as ConfigType['configEvents'],
        })),
      );
    }
  } catch {
    // 静默处理
  }
}

export default libraryPhotos;
