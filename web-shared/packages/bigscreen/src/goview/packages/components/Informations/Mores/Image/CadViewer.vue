<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div ref="wrapRef" class="cad-viewer h-full w-full overflow-hidden">
    <FileViewer
      v-if="viewerReady"
      :url="directUrl"
      :file="cadFile"
      :filename="resolvedFilename"
      :options="fileViewerOptions"
      style="display: block; width: 100%; height: 100%"
    />
    <div v-else-if="loadError" class="cad-viewer-tip">{{ loadError }}</div>
    <div v-else class="cad-viewer-tip">{{ editorT('bigscreenEditor.ui.componentLoadingCAD') }}</div>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

/**
 * CAD 图纸渲染子组件（图片组件的 CAD 分支专用）
 *
 * 复用知识库同一 file-viewer 组件生态（@file-viewer/vue3 + renderer-cad），
 * 底层为 @flyfish-dev/cad-viewer（LibreDWG WASM），支持 DWG/DXF/DWF/DWFx/XPS。
 * 由 Image/index.vue 通过 defineAsyncComponent 懒加载，避免 WASM 撑大普通图片组件 chunk。
 *
 * 跨域处理：CAD 渲染器需要 fetch 文件字节，COS 等对象存储默认域名未配置 CORS 时浏览器
 * 会直接拦截（<img> 不受 CORS 约束所以普通图片无此问题）。因此对跨域地址先经后端
 * file-proxy 同源代理拉取 Blob，再以 file 方式交给 FileViewer 渲染；
 * 同源/相对地址仍直接走 url 渲染，不做多余代理。
 *
 * 外壳 UI 处理：大屏场景要求像图片组件一样"干净出图"，因此隐藏查看器全部外壳
 * （外层工具栏用官方 toolbar:false；内层 cad-toolbar / 图层 / 结构 / SHX 警告）。
 * 注意 file-viewer 的 DOM 渲染在 .file-viewer 宿主的 open shadowRoot 内，普通 CSS
 * 与 :deep() 均无法触达，需向 shadowRoot 幂等注入 <style>；且 .cad-body 是 CSS grid，
 * 隐藏两侧 aside 后必须同步把 grid-template-columns 压成单列，否则空轨道仍然占宽。
 */
import { shallowRef, ref, computed, watch, nextTick } from 'vue';
import { FileViewer, type FileViewerOptions } from '@file-viewer/vue3';
import cadRenderer from '@file-viewer/renderer-cad';
import { getRequestClient } from '@vben/api';

import '@file-viewer/vue3/dist/file-viewer3.css';

defineOptions({ name: 'CadViewer' });

interface Props {
  /** CAD 文件地址（资源库 URL，与图片组件 option.dataset 一致） */
  url: string;
  /** 文件名（供 file-viewer 推断格式），可选 */
  filename?: string;
}

const props = withDefaults(defineProps<Props>(), {
  filename: '',
});

// CAD 渲染器按需显式装配（与知识库 detail.vue 的 file-viewer 用法一致）
// toolbar:false 关闭外层工具栏（下载/打印/HTML 等），大屏场景只保留纯净图纸画面
const fileViewerOptions: FileViewerOptions = {
  // renderer-cad 的插件泛型特化（具体实例/HTMLDivElement）与通用输入签名无结构重叠，
  // 按官方建议经 unknown 中转断言为目标渲染器列表，运行时行为不变
  renderers: [cadRenderer] as unknown as FileViewerOptions['renderers'],
  rendererMode: 'replace',
  theme: 'light',
  toolbar: false,
};

/** 直接渲染地址（同源/相对地址时使用），跨域时为空 */
const directUrl = ref('');
/** 跨域地址经代理拉取后的文件对象 */
const cadFile = shallowRef<File>();
const viewerReady = ref(false);
const loadError = ref('');
/** 组件根节点，用于定位 file-viewer 的 shadow host */
const wrapRef = ref<HTMLDivElement>();

/**
 * 向 file-viewer 的 shadowRoot 幂等注入隐藏内层外壳的样式。
 * 外壳清单：cad-toolbar（Fit/缩放/DWG/WEBGL 切换）、cad-layers（图层）、
 * cad-inspector（结构）、cad-warning（SHX 缺字体警告条）。
 * .cad-body 为 grid 布局，隐藏 aside 后必须把 grid-template-columns 压成单列，
 * 否则空轨道继续占位导致画布被挤窄（已在 .temp/cad-dwg-test 实测验证）。
 */
function ensureChromeHidden() {
  const host = wrapRef.value?.querySelector('.file-viewer');
  const shadow = host?.shadowRoot;
  if (!shadow || shadow.querySelector('style[data-cad-hide-chrome]')) return;
  const style = document.createElement('style');
  style.dataset.cadHideChrome = '1';
  style.textContent = [
    '.cad-toolbar{display:none!important}',
    '.cad-layers,.cad-inspector{display:none!important}',
    '.cad-body,.cad-body.without-layers{grid-template-columns:minmax(0,1fr)!important}',
    '.cad-warning{display:none!important}',
  ].join('');
  shadow.appendChild(style);
  // 注入后画布容器宽度变化，触发一次 resize 让 CAD 渲染器重排铺满
  window.dispatchEvent(new Event('resize'));
}

/** 从地址或入参推导带扩展名的文件名，供 file-viewer 识别 CAD 格式 */
const resolvedFilename = computed(() => {
  if (props.filename) return props.filename;
  const clean = props.url.split(/[?#]/)[0] || '';
  const name = clean.slice(clean.lastIndexOf('/') + 1);
  return name || 'cad.dwg';
});

/** 判断地址是否为跨域绝对地址（相对地址、同源地址、data: 均视为可直接加载） */
function isCrossOrigin(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    return new URL(url).origin !== window.location.origin;
  } catch {
    return false;
  }
}

async function resolveSource(url: string) {
  viewerReady.value = false;
  loadError.value = '';
  cadFile.value = undefined;
  directUrl.value = '';
  if (!url) {
    loadError.value = editorT('bigscreenEditor.ui.componentCADURLIsEmpty');
    return;
  }
  if (!isCrossOrigin(url)) {
    directUrl.value = url;
    viewerReady.value = true;
    return;
  }
  try {
    const proxyUrl = `/api/v1/system/common/file-proxy?url=${encodeURIComponent(url)}`;
    const blob = await getRequestClient().download(proxyUrl);
    cadFile.value = new File([blob], resolvedFilename.value);
    viewerReady.value = true;
  } catch (err) {
    loadError.value = editorT('bigscreenEditor.dynamic.cadLoadFailed', { message: String(err instanceof Error ? err.message : editorT('bigscreenEditor.ui.networkError')) });
  }
}

watch(() => props.url, (url) => resolveSource(url), { immediate: true });

// FileViewer 挂载后（shadow host 已存在、CAD 首次布局前）尽早注入隐藏样式
watch(viewerReady, async (ready) => {
  if (!ready) return;
  await nextTick();
  ensureChromeHidden();
});
</script>

<style scoped>
.cad-viewer {
  background: #fff;
}

.cad-viewer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #999;
}
</style>
