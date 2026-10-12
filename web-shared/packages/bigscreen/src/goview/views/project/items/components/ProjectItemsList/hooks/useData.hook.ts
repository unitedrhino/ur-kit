/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { ref } from 'vue'
import { goDialog } from '@/utils'
import { DialogEnum } from '@/enums/pluginEnum'
import type { ChartList } from '../../../index.type'
// 数据初始化
export const useDataListInit = () => {
  const list = ref<ChartList>([
    {
      id: 1,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sampleAsset1MockDataUnavailable'); },
      release: true,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.officialExamples'); }
    },
    {
      id: 2,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sampleAsset2MockDataUnavailable'); },
      release: false,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.officialExamples'); }
    },
    {
      id: 3,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sampleAsset3MockDataUnavailable'); },
      release: false,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.officialExamples'); }
    },
    {
      id: 4,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sampleAsset4MockDataUnavailable'); },
      release: false,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.officialExamples'); }
    },
    {
      id: 5,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.sampleAsset5MockDataUnavailable'); },
      release: false,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.officialExamples'); }
    }
  ])

  // 删除
  const deleteHandle = (cardData: object, index: number) => {
    goDialog({
      type: DialogEnum.DELETE,
      promise: true,
      onPositiveCallback: () =>
        new Promise(res => setTimeout(() => res(1), 1000)),
      promiseResCallback: (e: any) => {
        window.$message.success(editorT('orgManage.common.deleteSuccess'))
        list.value.splice(index, 1)
      }
    })
  }

  return {
    list,
    deleteHandle
  }
}
