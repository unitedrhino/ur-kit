/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { ref, nextTick } from 'vue'
import type { UploadCustomRequestOptions } from 'naive-ui'
import { FileTypeEnum } from '@/enums/fileTypeEnum'
import { readFile, goDialog, JSONParse } from '@/utils'
import { useSync } from '@/views/chart/hooks/useSync.hook'

export const useFile = () => {
  const importUploadFileListRef = ref()
  const { updateComponent } = useSync()

  // 上传-前置
  //@ts-ignore
  const importBeforeUpload = ({ file }) => {
    importUploadFileListRef.value = []
    const type = file.file.type
    if (type !== FileTypeEnum.JSON && type !== FileTypeEnum.TXT) {
      window['$message'].warning(editorT('bigscreenEditor.ui.onlyJSONFilesAreSupportedPleaseUploadAgain'))
      return false
    }
    return true
  }

  // 上传-导入
  const importCustomRequest = (options: UploadCustomRequestOptions) => {
    const { file } = options
    nextTick(() => {
      if (file.file) {
        readFile(file.file).then((fileData: any) => {
          goDialog({
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get message() { return editorT('bigscreenEditor.ui.selectImportMethod'); },
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('bigscreenEditor.ui.addCanBeUndone'); },
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('bigscreenEditor.ui.overwriteCannotBeUndone'); },
            negativeButtonProps: { type: 'info', ghost: false },
            // 新增
            onPositiveCallback: async () => {
              try {
                fileData = JSONParse(fileData)
                await updateComponent(fileData, false, true)
                window['$message'].success(editorT('bigscreenEditor.ui.importedSuccessfully'))
              } catch (error) {
                console.log(error)
                window['$message'].error(editorT('bigscreenEditor.ui.componentImportFailedCheckFileIntegrity'))
              }
            },
            // 覆盖
            onNegativeCallback: async () => {
              try {
                fileData = JSONParse(fileData)
                await updateComponent(fileData, true, true)
                window['$message'].success(editorT('bigscreenEditor.ui.importedSuccessfully'))
              } catch (error) {
                console.log(error)
                window['$message'].error(editorT('bigscreenEditor.ui.componentImportFailedCheckFileIntegrity'))
              }
            }
          })
        })
      } else {
        window['$message'].error(editorT('bigscreenEditor.ui.importFailedCheckDataOrContactAdministrator'))
      }
    })
  }

  return {
    importUploadFileListRef,
    importBeforeUpload,
    importCustomRequest
  }
}
