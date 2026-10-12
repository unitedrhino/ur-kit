/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
// 鼠标点击左右键
export enum MouseEventButton {
  LEFT = 1,
  RIGHT = 2,
}

// 页面拖拽键名
export enum DragKeyEnum {
  CUSTOM_DRAG_KEY = 'CustomComponentData',
  DRAG_KEY = 'ChartData',
  SCREEN_TEMPLATE_DRAG_KEY = 'ScreenTemplateData',
}

// 不同页面保存操作
export enum SavePageEnum {
  CHART = 'SaveChart',
  CHART_TO_PREVIEW = 'ChartToPreview',
  CLOSE = 'close',
  JSON = 'SaveJSON',
}

// 操作枚举
export enum MenuEnum {
  ARROW_DOWN = 'down',
  ARROW_LEFT = 'left',
  ARROW_RIGHT = 'right',
  // 移动
  ARROW_UP = 'up',
  // 后退
  BACK = 'back',
  // 置底
  BOTTOM = 'bottom',
  // 清空剪贴板
  CLEAR = 'clear',
  // 复制
  COPY = 'copy',
  // 剪切
  CUT = 'cut',
  // 删除
  DELETE = 'delete',
  // 下移
  DOWN = 'down',
  // 前进
  FORWORD = 'forward',
  // 成组
  GROUP = 'group',
  // 隐藏
  HIDE = 'hide',
  // 锁定
  LOCK = 'lock',
  // 粘贴
  PARSE = 'parse',
  // 保存
  SAVE = 'save',
  // 保存为我的组件
  SAVE_AS_TEMPLATE = 'saveAsTemplate',
  // 显示
  SHOW = 'show',
  // 置顶
  TOP = 'top',
  // 解组
  UN_GROUP = 'unGroup',
  // 解除锁定
  UNLOCK = 'unLock',
  // 上移
  UP = 'up',
}

// Win 键盘枚举
export enum WinKeyboard {
  ALT = ' alt',
  ALT_SOURCE_KEY = 'alt',
  CTRL = 'ctrl',
  CTRL_SOURCE_KEY = 'control',
  SHIFT = 'shift',
  SHIFT_SOURCE_KEY = 'shift',
  SPACE = 'Space',
}

// Mac 键盘枚举
export enum MacKeyboard {
  ALT = '⌥',
  ALT_SOURCE_KEY = '⌥',
  // 还是用 Command 吧
  CTRL = '⌘',
  CTRL_SOURCE_KEY = '⌘',
  SHIFT = '⇧',
  SHIFT_SOURCE_KEY = '⇧',
  SPACE = 'Space',
}
