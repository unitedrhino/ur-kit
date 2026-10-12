/** 文件说明：组件动态提示读取宿主语言，保留业务名称与参数。 */
import { $t as editorT } from '@vben/saas/locales';
/**
 * 内嵌页面组件「上传页面包」逻辑
 *
 * 封装 zip 页面包的前端校验（扩展名/大小）与 upload-zip 接口调用：
 * - 校验纯函数与接口调用拆开，便于单测覆盖校验规则
 * - codegen client（ViewView.postApiV1ViewAssetUploadZip）的请求模型仅含 file 字段，
 *   screenId 等后端 multipart form 附加字段并入同一个 FormData 整体提交
 */
import { ViewView } from '@vben/api';

/** 平台托管场景包入口 URL 前缀（与后端 viewsvr SceneEntryURL 固定格式一致） */
export const SCENE_URL_PREFIX = '/api/v1/view/scene/';

/** 页面包大小上限（与后端 sceneZipMaxSize 一致：100MB） */
export const SCENE_ZIP_MAX_SIZE = 100 * 1024 * 1024;

/** 页面包大小上限的展示文案 */
export const SCENE_ZIP_MAX_SIZE_TEXT = '100MB';

/**
 * 判断页面地址是否为平台托管包入口（上传 zip 成功后回填的地址）
 * @param url 组件 option.url
 * @returns 以 /api/v1/view/scene/ 开头视为平台托管包
 */
export function isHostedSceneUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith(SCENE_URL_PREFIX);
}

/**
 * 校验待上传的 zip 页面包
 * @param file 用户选择的文件
 * @returns 校验失败时的提示文案；合法返回 null
 */
export function validateSceneZipFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return '仅支持上传 .zip 页面包';
  }
  if (file.size > SCENE_ZIP_MAX_SIZE) {
    return editorT('bigscreenEditor.dynamic.pagePackageTooLarge', { size: String(SCENE_ZIP_MAX_SIZE_TEXT) });
  }
  return null;
}

/**
 * 组装 upload-zip 的 multipart 表单（file + 当前大屏 screenId）
 * @param file 已通过校验的 zip 文件
 * @param screenId 当前编辑中大屏 id（后端按其归属鉴权并决定对象目录）
 */
export function buildSceneZipForm(file: File, screenId: string): FormData {
  const form = new FormData();
  form.append('file', file);
  form.append('screenId', screenId);
  return form;
}

/**
 * 上传 zip 页面包到平台托管（asset/upload-zip）
 * @param file 已通过校验的 zip 文件
 * @param screenId 当前大屏 id
 * @returns 接口返回的场景包信息（entryUrl 供回填 option.url）
 * @throws 接口失败时抛出原始错误，由调用方统一 toast 提示
 */
export async function uploadSceneZip(file: File, screenId: string): Promise<ViewView.AssetUploadZipResp> {
  // codegen 请求模型仅声明 file 字段；screenId 为后端 multipart form 字段，
  // 以 FormData 整体提交，Content-Type 须显式 multipart 避免默认 JSON 头触发 formDataToJSON
  return await ViewView.postApiV1ViewAssetUploadZip(
    buildSceneZipForm(file, screenId) as unknown as ViewView.PostApiV1ViewAssetUploadZipRequest,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}
