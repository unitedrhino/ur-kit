/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { ref, nextTick } from 'vue';
import type { UploadCustomRequestOptions } from 'naive-ui';
import { FileTypeEnum } from '@/enums/fileTypeEnum';
import { readFile, downloadTextFile, JSONStringify, JSONParse } from '@/utils';

export const useFile = (targetData: any) => {
  const uploadFileListRef = ref();

  //@ts-ignore
  const beforeUpload = ({ file }) => {
    uploadFileListRef.value = [];
    const type = file.file.type;
    if (type !== FileTypeEnum.JSON && type !== FileTypeEnum.TXT) {
      window['$message'].warning(editorT('bigscreenEditor.ui.onlyJSONFilesAreSupportedPleaseUploadAgain'));
      return false;
    }
    return true;
  };

  // 自定义上传操作
  const customRequest = (options: UploadCustomRequestOptions) => {
    const { file } = options;
    nextTick(() => {
      if (file.file) {
        readFile(file.file).then((fileData: any) => {
          targetData.value.option.dataset = JSONParse(fileData);
        });
      } else {
        window['$message'].error(editorT('bigscreenEditor.ui.dataImportFailedTryAgainLaterOrContact'));
      }
    });
  };

  // 下载文件
  const download = () => {
    try {
      window['$message'].success(editorT('bigscreenEditor.ui.downloadingPleaseWait'));
      downloadTextFile(JSONStringify(targetData.value.option.dataset), undefined, 'json');
    } catch (error) {
      window['$message'].error(editorT('bigscreenEditor.ui.downloadFailedInvalidData'));
    }
  };
  return {
    uploadFileListRef,
    beforeUpload,
    customRequest,
    download,
  };
};
