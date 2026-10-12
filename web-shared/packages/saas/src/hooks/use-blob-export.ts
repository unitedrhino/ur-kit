
import { notifyRequestError } from '@vben/saas/request-error';
/**
 * 通用 Blob 导出 composable
 * 消除各模块重复的 blob 下载样板代码
 *
 * @example
 * const { exporting, download } = useBlobExport(Api.exportData);
 * // <NButton :loading="exporting" @click="download(formValues, '导出.xlsx')">导出</NButton>
 */
import { ref } from 'vue';
import { message } from '@vben/saas/naive';

/**
 * 创建 Blob 导出工具
 * @param exportFn - 执行导出并返回 Blob 的异步函数
 * @returns exporting 状态、error 信息、download 下载方法
 */
export function useBlobExport<T extends any[]>(
  exportFn: (...params: T) => Promise<Blob>,
) {
  const exporting = ref(false);
  const error = ref<string | null>(null);

  const download = async (
    params: T,
    filename: string,
    options?: { onSuccess?: () => void; onError?: (e: Error) => void },
  ) => {
    exporting.value = true;
    error.value = null;
    try {
      const blob = await exportFn(...params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('导出成功');
      options?.onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '导出失败';
      error.value = msg;
      notifyRequestError(e, () => msg, (text) => message.error(text));
      options?.onError?.(e as Error);
    } finally {
      exporting.value = false;
    }
  };

  return { exporting, error, download };
}
