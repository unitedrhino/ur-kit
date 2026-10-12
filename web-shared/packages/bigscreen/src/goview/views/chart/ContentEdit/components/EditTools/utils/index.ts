/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { canvasCut, downloadTextFile, JSONStringify } from '@/utils'
// 导出
export const exportHandle = () => {
  const chartEditStore = useChartEditStore()
  // 取消选中
  chartEditStore.setTargetSelectChart(undefined)

  // 导出数据
  downloadTextFile(
    JSONStringify(chartEditStore.getStorageInfo() || []),
    undefined,
    'json'
  )

  // 导出图片
  const range = document.querySelector('.go-edit-range') as HTMLElement
  const watermark = document.getElementById('go-edit-watermark')
  // 隐藏边距线
  if (!range || !watermark) {
    window['$message'].error(editorT('bigscreenEditor.ui.exportFailed'))
    return
  }

  // 记录缩放比例
  const scaleTemp = chartEditStore.getEditCanvas.scale
  // 百分百展示页面
  chartEditStore.setScale(1, true)
  // 展示水印
  watermark.style.display = 'block'

  setTimeout(() => {
    canvasCut(range, () => {
      // 隐藏水印
      if (watermark) watermark.style.display = 'none'
      // 还原页面大小
      chartEditStore.setScale(scaleTemp, true)
    })
  }, 600)
}
