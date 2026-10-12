/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type';

import axiosInstance from '@/api/axios';
import { FileTypeEnum } from '@/enums/fileTypeEnum';
import { StorageEnum } from '@/enums/storageEnum';
import { ImageConfig } from '@/packages/components/Informations/Mores/Image/index';
import { ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type';
import { backgroundImageSize } from '@/settings/designSetting';
import { usePackagesStore } from '@/store/modules/packagesStore/packagesStore';
import { getLocalStorage } from '@/utils';
import { useSessionStore } from '@vben/saas';

import { ChatCategoryEnum, ChatCategoryEnumName } from '../index.type';

const StoreKey = StorageEnum.GO_USER_MEDIA_PHOTOS + '_' + (useSessionStore().tenantCode || 'default');

/**
 * 上传完成事件类型
 */
type UploadCompletedEventType = {
  fileName: string;
  url: string;
};

const userPhotosList: ConfigType[] = getLocalStorage(StoreKey) || [];

const uploadFile = (callback: Function | null = null) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.png,.jpg,.jpeg,.gif,.svg,.bmp';
  input.addEventListener('change', async () => {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    // 前面已校验 length > 0，此守卫仅为类型收窄
    if (!file) return;
    const { name, size, type } = file;
    if (size > 1024 * 1024 * backgroundImageSize) {
      window.$message.warning(editorT('bigscreenEditor.dynamic.message10', { size: String(backgroundImageSize) }));
      return;
    }
    if (type !== FileTypeEnum.PNG && type !== FileTypeEnum.JPEG && type !== FileTypeEnum.GIF && type !== FileTypeEnum.SVG && type !== FileTypeEnum.BMP) {
      window.$message.warning(editorT('bigscreenEditor.ui.unsupportedFileFormatPleaseUploadAgain'));
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosInstance.post('/api/v1/system/common/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const ossUrl = (res as any)?.data?.fileUri;
      if (!ossUrl) {
        window.$message.error(editorT('bigscreenEditor.ui.uploadReturnedNoURLPleaseTryAgain'));
        return;
      }
      const url = ossUrl;
      callback && callback({ fileName: name, url });
    } catch {
      window.$message.error(editorT('bigscreenEditor.ui.imageUploadFailedPleaseTryAgainLater'));
    }
  });
  input.click();
};

const addConfig = {
  ...ImageConfig,
  category: ChatCategoryEnum.LOCAL,
  categoryName: ChatCategoryEnumName.LOCAL,
  package: PackagesCategoryEnum.PHOTOS,
  chartFrame: ChartFrameEnum.STATIC,
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentClickToUploadImage'); },
  image: 'upload.png',
  redirectComponent: `${ImageConfig.package}/${ImageConfig.category}/${ImageConfig.key}`, // 跳转组件路径规则：packageName/categoryName/componentKey
  disabled: true,
  configEvents: {
    // 点击上传事件
    addHandle: (photoConfig: ConfigType) => {
      uploadFile((e: UploadCompletedEventType) => {
        const packagesStore = usePackagesStore();
        const newPhoto = {
          ...ImageConfig,
          category: ChatCategoryEnum.LOCAL,
          categoryName: ChatCategoryEnumName.LOCAL,
          package: PackagesCategoryEnum.PHOTOS,
          chartFrame: ChartFrameEnum.STATIC,
          title: e.fileName,
          image: e.url,
          dataset: e.url,
          assetSource: 'local',
          redirectComponent: `${ImageConfig.package}/${ImageConfig.category}/${ImageConfig.key}`,
        };
        // localStorage 的维护统一由 packagesStore.addPhotos 负责
        // 不再使用模块级 userPhotosList 写入，避免删除后因模块缓存导致数据复活
        packagesStore.addPhotos(newPhoto, 1);
      });
    },
  },
};

export default [addConfig, ...userPhotosList];
