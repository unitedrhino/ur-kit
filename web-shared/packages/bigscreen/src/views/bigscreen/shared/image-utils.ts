/**
 * 图片工具函数
 *
 * 提供 URL → Base64、Base64 压缩等跨环境图片处理能力，
 * 使模板/大屏封面不再依赖 OSS 环境一致性。
 */

/**
 * 将图片 URL 转为 Base64 data URL
 *
 * 使用 fetch + FileReader 将远程图片转为 data URL。
 * 跨域图片可能因 CORS 限制而失败，调用方应做好降级处理。
 */
export async function urlToBase64(url: string): Promise<string> {
  // 将任意 URL 转为经 Vite 代理（dev）或同域直连（prod）的请求，避免 CORS 问题
  let fullUrl = url;
  try {
    const parsed = new URL(url, window.location.origin);
    // 如果解析后的 origin 与当前页面 origin 不同，替换 path 到当前 origin
    if (parsed.origin !== window.location.origin) {
      fullUrl = new URL(parsed.pathname + parsed.search, window.location.origin).toString();
    } else {
      fullUrl = parsed.toString();
    }
  } catch {
    fullUrl = url;
  }
  const resp = await fetch(fullUrl);
  const blob = await resp.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 压缩 Base64 图片为缩略图尺寸
 *
 * 将图片缩放到指定最大宽度（按比例缩放高度），
 * 输出 WebP 格式（不支持时降级 JPEG），大幅减小体积。
 *
 * @param base64Str  原始 base64 data URL
 * @param maxWidth   目标最大宽度（px），默认 300
 * @param quality    WebP/JPEG 质量（0~1），默认 0.4
 * @returns          压缩后的 base64 data URL
 */
export function compressImage(
  base64Str: string,
  maxWidth = 300,
  quality = 0.4,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 按比例缩放，锁死宽度
      const targetWidth = Math.min(img.width, maxWidth);
      const targetHeight = (img.height / img.width) * targetWidth;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 优先 WebP（体积小），不支持时降级 JPEG
      const mimeType =
        canvas.toDataURL('image/webp', quality).startsWith('data:image/webp')
          ? 'image/webp'
          : 'image/jpeg';
      const compressed = canvas.toDataURL(mimeType, quality);
      resolve(compressed);
    };
    img.onerror = () => {
      reject(new Error('图片加载失败，无法压缩'));
    };
    img.src = base64Str;
  });
}
