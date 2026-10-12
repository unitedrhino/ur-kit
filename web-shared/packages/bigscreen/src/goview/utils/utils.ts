/** 文件说明：编辑器辅助能力的界面提示随宿主语言更新。 */
import { $t as editorT } from '@vben/saas/locales';
import type { RequestParamsObjType } from '@/enums/httpEnum';
import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import { h } from 'vue';

import { WinKeyboard } from '@/enums/editPageEnum';
import { RequestHttpIntervalEnum } from '@/enums/httpEnum';
import html2canvas from 'html2canvas';
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import { NIcon } from 'naive-ui';
import screenfullModule from 'screenfull';

import { isUnsafeDynamicJsAllowed, warnDynamicJsBlocked } from '../../shared/dynamic-js-policy';
import Image_404 from '../assets/images/exception/image-404.png';
import { downloadByA } from './file';
import { toString } from './type';

/**
 * 判断是否是开发环境
 * @return {boolean}
 */
export const isDev = () => {
  return import.meta.env.DEV;
};

/**
 * 生成一个不重复的ID
 * @param {number} randomLength
 */
export const getUUID = (randomLength = 10) => {
  return `id_${Number(Math.random().toString().substring(2, randomLength) + Date.now()).toString(36)}`;
};

/**
 * render 图标
 *  @param icon 图标
 *  @param set 设置项
 */
export const renderIcon = (icon: any, set = {}) => {
  return () => h(NIcon, set, { default: () => h(icon) });
};
/**
 * render 语言
 *  @param lang 语言标识
 *  @param set 设置项
 *  @param tag 要渲染成的标签
 */
export const renderLang = (lang: string, set = {}, tag = 'span') => {
  return () => h(tag, set, { default: () => window.$t(lang) });
};

/**
 * 获取错误处理图片，默认 404 图
 * @returns url
 */
export const requireErrorImg = () => {
  return Image_404;
};

/**
 * 解析 screenfull 实例。
 *
 * screenfull 是带 `__esModule` 的 TS 编译 CJS 包，不同打包器 CJS 互操作的默认导入
 * 解包层级不同：rolldown（vite 8）下默认导入是整个 module.exports（真实例在 .default），
 * vite 7 穿透语义下默认导入本身即真实例。`default ?? 模块` 两段式在两种语义下
 * 都解析到正确实例（写法对齐 vben 上游 secure-ls 的适配模式）。
 */
const screenfull =
  (screenfullModule as unknown as { default?: typeof screenfullModule }).default ??
  (screenfullModule as unknown as typeof screenfullModule);

/**
 * 全屏操作函数
 * @param isFullscreen
 * @param isEnabled
 * @returns
 */
export const screenfullFn = (isFullscreen?: boolean, isEnabled?: boolean) => {
  // 是否是全屏
  if (isFullscreen) return screenfull.isFullscreen;

  // 是否支持全屏
  if (isEnabled) return screenfull.isEnabled;

  if (screenfull.isEnabled) {
    screenfull.toggle();
    return;
  }
  window.$message.warning(editorT('bigscreenEditor.ui.fullscreenUnsupported'));
};

/**
 * 修改元素位置
 * @param target 对象
 * @param x X轴
 * @param y Y轴
 */
export const setComponentPosition = (target: CreateComponentGroupType | CreateComponentType, x?: number, y?: number) => {
  x && (target.attr.x = x);
  y && (target.attr.y = y);
};

/**
 * 设置元素属性
 * @param HTMLElement 元素
 * @param key 键名
 * @param value 键值
 */
export const setDomAttribute = <K extends keyof CSSStyleDeclaration, V extends CSSStyleDeclaration[K]>(HTMLElement: HTMLElement, key: K, value: V) => {
  if (HTMLElement) {
    HTMLElement.style[key] = value;
  }
};

/**
 * 判断是否是 mac
 * @returns boolean
 */
export const isMac = () => {
  return /macintosh|mac os x/i.test(navigator.userAgent);
};

/**
 * file转url
 */
export const fileToUrl = (file: File): string => {
  const Url = URL || window.URL || window.webkitURL;
  const ImageUrl = Url.createObjectURL(file);
  return ImageUrl;
};

/**
 * file转base64
 */
export const fileTobase64 = (file: File, callback: Function) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.addEventListener('load', (e: ProgressEvent<FileReader>) => {
    if (e.target) {
      const base64 = e.target.result;
      callback(base64);
    }
  });
};

/**
 * 挂载监听
 */

export const addEventListener = <K extends keyof WindowEventMap>(
  target: Document | HTMLElement,
  type: K,
  listener: any,
  delay?: number,

  options?: AddEventListenerOptions | boolean | undefined,
) => {
  if (!target) return;
  target.addEventListener(
    type,
    throttle(listener, delay || 300, {
      leading: true,
      trailing: false,
    }),
    options,
  );
};

/**
 * 卸载监听
 */

export const removeEventListener = <K extends keyof WindowEventMap>(target: Document | HTMLElement, type: K, listener: any) => {
  if (!target) return;
  target.removeEventListener(type, listener);
};

/**
 * 截取画面为图片并下载
 * @param html 需要截取的 DOM
 */
export const canvasCut = (html: HTMLElement | null, callback?: Function) => {
  if (!html) {
    window.$message.error(editorT('bigscreenEditor.ui.exportFailed'));
    if (callback) callback();
    return;
  }

  html2canvas(html, {
    backgroundColor: null,
    allowTaint: true,
    useCORS: true,
  }).then((canvas: HTMLCanvasElement) => {
    window.$message.success(editorT('bigscreenEditor.ui.exportSucceeded'));
    downloadByA(canvas.toDataURL(), undefined, 'png');
    if (callback) callback();
  });
};

/**
 * @deprecated 请使用 sandboxExecute（Worker 沙盒隔离版本）替代
 * @see {@link ./sandboxExecute.ts}
 *
 * 函数过滤器（主线程裸执行，无安全隔离）
 * @param data 数据值
 * @param res 返回顶级对象
 * @param funcStr 函数字符串
 * @param isToString 是否转为字符串
 * @param errorCallBack 错误回调函数
 * @param successCallBack 成功回调函数
 * @returns
 */
export const newFunctionHandle = (data: any, res: any, funcStr?: string, isToString?: boolean, errorCallBack?: Function, successCallBack?: Function) => {
  try {
    if (!funcStr) return data;
    if (!isUnsafeDynamicJsAllowed()) {
      warnDynamicJsBlocked('newFunctionHandle');
      return isToString ? toString(data) : data;
    }
    const fn = new Function('data', 'res', funcStr);
    const fnRes = fn(cloneDeep(data), cloneDeep(res));
    const resHandle = isToString ? toString(fnRes) : fnRes;
    // 成功回调
    successCallBack && successCallBack(resHandle);
    return resHandle;
  } catch (error) {
    // 失败回调
    errorCallBack && errorCallBack(error);
    return editorT('bigscreenEditor.ui.functionFailed');
  }
};

/**
 * 处理请求事件单位
 * @param num 时间间隔
 * @param unit RequestHttpIntervalEnum
 * @return number 秒数
 */
export const intervalUnitHandle = (num: number, unit: RequestHttpIntervalEnum) => {
  switch (unit) {
    // 天
    case RequestHttpIntervalEnum.DAY: {
      return num * 1000 * 60 * 60 * 24;
    }
    // 时
    case RequestHttpIntervalEnum.HOUR: {
      return num * 1000 * 60 * 60;
    }
    // 分
    case RequestHttpIntervalEnum.MINUTE: {
      return num * 1000 * 60;
    }
    // 秒
    case RequestHttpIntervalEnum.SECOND: {
      return num * 1000;
    }
    default: {
      return num * 1000;
    }
  }
};

/**
 * 对象转换 cookie 格式
 * @param obj
 * @returns string
 */
export const objToCookie = (obj: RequestParamsObjType) => {
  if (!obj) return '';

  let str = '';
  for (const key in obj) {
    str += `${key}=${obj[key]};`;
  }
  return str.slice(0, Math.max(0, str.length - 1));
};

/**
 * 设置按下键盘按键的底部展示
 * @param keyCode
 * @returns
 */
export const setKeyboardDressShow = (keyCode?: number) => {
  const code = new Map([
    [17, WinKeyboard.CTRL],
    [32, WinKeyboard.SPACE],
  ]);

  const dom = document.querySelector<HTMLElement>('#keyboard-dress-show');
  if (!dom) return;
  if (!keyCode) {
    window.onKeySpacePressHold?.(false);
    dom.innerText = '';
    return;
  }
  if (keyCode && code.has(keyCode)) {
    if (keyCode == 32) window.onKeySpacePressHold?.(true);
    dom.innerText = `按下了「${code.get(keyCode)}」键`;
  }
};

/**
 * JSON序列化，支持函数和 undefined
 * @param data
 */
export const JSONStringify = <T>(data: T) => {
  return JSON.stringify(
    data,
    (key, val) => {
      // 处理函数丢失问题
      if (typeof val === 'function') {
        return `${val}`;
      }
      // 处理 undefined 丢失问题
      if (val === undefined) {
        return null;
      }
      return val;
    },
    2,
  );
};

export const evalFn = (fn: string) => {
  const Fun = Function; // 一个变量指向Function，防止前端编译工具报错
  return new Fun(`return ${fn}`)();
};

/**
 * JSON反序列化，支持函数和 undefined
 * @param data
 */
export const JSONParse = (data: string) => {
  if (data.trim() === '') return;
  return JSON.parse(data, (k, v) => {
    // // 过滤函数字符串
    // if (excludeParseEventKeyList.includes(k)) return v
    // // 过滤函数值表达式
    // if (typeof v === 'string') {
    //   const someValue = excludeParseEventValueList.some(excludeValue => v.indexOf(excludeValue) > -1)
    //   if (someValue) return v
    // }
    if (k !== 'formatter') {
      return v;
    }
    // 还原函数值
    if (typeof v === 'string' && (v.includes('function') || v.includes('=>'))) {
      return evalFn(`(function(){return ${v}})()`);
    } else if (typeof v === 'string' && v.includes('return ')) {
      const baseLeftIndex = v.indexOf('(');
      if (baseLeftIndex !== -1) {
        const newFn = `function ${v.slice(Math.max(0, baseLeftIndex))}`;
        return evalFn(`(function(){return ${newFn}})()`);
      }
    }
    return v;
  });
};

/**
 * 修改顶部标题
 * @param title
 */
export const setTitle = (title?: string) => {
  title && (document.title = title);
};
