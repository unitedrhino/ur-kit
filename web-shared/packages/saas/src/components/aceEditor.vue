<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

import { loadScript } from '@vben/utils';

// 定义 window.ace 类型
declare global {
  interface Window {
    ace: any;
  }
}

const ACE_SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.43.3/ace.js';
let aceLoadPromise: null | Promise<void> = null;

export interface AceEditorProps {
  /** 编辑器的值 */
  modelValue?: string;
  /** 编辑器高度 */
  height?: string | number;
  /** 编辑器宽度 */
  width?: string | number;
  /** 编辑器主题 */
  theme?: string;
  /** 编辑器语言模式 */
  mode?: string;
  /** 字体大小 */
  fontSize?: string | number;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否显示行号 */
  showGutter?: boolean;
  /** 是否显示打印边距 */
  showPrintMargin?: boolean;
  /** 是否自动换行 */
  wrap?: boolean;
  /** Tab 大小 */
  tabSize?: number;
  /** 是否使用软 Tab */
  useSoftTabs?: boolean;
  /** 是否启用基本自动补全 */
  enableBasicAutocompletion?: boolean;
  /** 是否启用实时自动补全 */
  enableLiveAutocompletion?: boolean;
  /** 是否启用代码片段 */
  enableSnippets?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 自定义样式类 */
  customClass?: string;
}

const props = withDefaults(defineProps<AceEditorProps>(), {
  modelValue: '',
  height: '400px',
  width: '100%',
  theme: 'monokai',
  mode: 'json',
  fontSize: '14px',
  readonly: false,
  showGutter: true,
  showPrintMargin: false,
  wrap: true,
  tabSize: 2,
  useSoftTabs: true,
  enableBasicAutocompletion: false,
  enableLiveAutocompletion: false,
  enableSnippets: false,
  placeholder: '',
  customClass: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
  'init': [editor: any];
  'blur': [];
  'focus': [];
}>();

const editorContainer = ref<HTMLElement>();
const editor = shallowRef<any>(null);
const isEditorReady = ref(false);
let initTimer: ReturnType<typeof setTimeout> | null = null;
let isDisposed = false;

async function ensureAceLoaded() {
  if (window.ace) return;
  aceLoadPromise ??= loadScript(ACE_SCRIPT_URL).catch((error) => {
    aceLoadPromise = null;
    throw error;
  });
  await aceLoadPromise;
  if (!window.ace) {
    throw new Error('ACE 编辑器脚本加载后未初始化');
  }
}

// 初始化 ACE 编辑器
const initEditor = async () => {
  if (!editorContainer.value) {
    // console.error('ACE 编辑器容器未找到');
    return;
  }

  try {
    await ensureAceLoaded();
  } catch (error) {
    console.error('ACE 编辑器加载失败:', error);
    return;
  }

  if (isDisposed || !editorContainer.value) {
    return;
  }

  // 创建编辑器实例
  editor.value = window.ace.edit(editorContainer.value);

  // 设置主题
  editor.value.setTheme(`ace/theme/${props.theme}`);

  // 设置语言模式
  editor.value.session.setMode(`ace/mode/${props.mode}`);

  // 设置编辑器选项
  editor.value.setOptions({
    fontSize: typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize,
    showGutter: props.showGutter,
    showPrintMargin: props.showPrintMargin,
    wrap: props.wrap,
    tabSize: props.tabSize,
    useSoftTabs: props.useSoftTabs,
    readOnly: props.readonly,
  });

  // 设置初始值
  if (props.modelValue) {
    editor.value.setValue(props.modelValue, -1);
  }

  // 清除选区
  editor.value.session.selection.clearSelection();

  // 设置占位符
  if (props.placeholder) {
    setPlaceholder(props.placeholder);
  }

  // 监听内容变化
  editor.value.on('change', () => {
    const value = editor.value.getValue();
    emit('update:modelValue', value);
    emit('change', value);
    updatePlaceholder();
  });

  // 监听焦点事件
  editor.value.on('blur', () => {
    emit('blur');
  });

  editor.value.on('focus', () => {
    emit('focus');
  });

  isEditorReady.value = true;
  emit('init', editor.value);
};

// 设置占位符
const setPlaceholder = (text: string) => {
  if (!editor.value) return;

  // 获取行号栏宽度，确保占位符不被遮挡
  const gutterWidth = props.showGutter ? 50 : 0;

  const placeholder = document.createElement('div');
  placeholder.className = 'ace-placeholder';
  placeholder.textContent = text;
  placeholder.style.cssText = `
    position: absolute;
    top: 4px;
    left: ${gutterWidth}px;
    padding: 0 10px;
    color: #6b7280;
    pointer-events: none;
    z-index: 1;
    line-height: 1.5;
    font-family: Monaco, Menlo, 'Ubuntu Mono', Consolas, monospace;
    font-size: ${typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize};
  `;

  editorContainer.value?.appendChild(placeholder);
  updatePlaceholder();
};

// 更新占位符显示/隐藏
const updatePlaceholder = () => {
  if (!editorContainer.value) return;
  const placeholder = editorContainer.value.querySelector('.ace-placeholder') as HTMLElement;
  if (placeholder) {
    placeholder.style.display = editor.value.getValue() ? 'none' : 'block';
  }
};

// 获取编辑器的值
const getValue = (): string => {
  return editor.value?.getValue() || '';
};

// 设置编辑器的值
const setValue = (value: string, cursorPos?: number) => {
  if (!editor.value) return;
  editor.value.setValue(value, cursorPos ?? -1);
  editor.value.session.selection.clearSelection();
};

// 格式化内容（针对 JSON）
const format = (): boolean => {
  if (!editor.value) return false;

  try {
    const content = editor.value.getValue();
    if (props.mode === 'json') {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, props.tabSize);
      setValue(formatted);
      return true;
    }
    return false;
  } catch (error) {
    console.error('格式化失败:', error);
    return false;
  }
};

// 验证内容（针对 JSON）
const validate = (): { valid: boolean; data?: any; error?: string } => {
  if (!editor.value) {
    return { valid: false, error: '编辑器未初始化' };
  }

  const content = editor.value.getValue();

  if (props.mode === 'json') {
    try {
      const data = JSON.parse(content);
      return { valid: true, data };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  return { valid: true, data: content };
};

// 清空编辑器
const clear = () => {
  setValue('');
};

// 获取编辑器实例
const getEditor = () => {
  return editor.value;
};

// 设置只读模式
const setReadOnly = (readonly: boolean) => {
  if (editor.value) {
    editor.value.setReadOnly(readonly);
  }
};

// 聚焦编辑器
const focus = () => {
  if (editor.value) {
    editor.value.focus();
  }
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && newValue !== editor.value.getValue()) {
      setValue(newValue);
    }
  },
);

// 监听只读属性变化
watch(
  () => props.readonly,
  (newValue) => {
    setReadOnly(newValue);
  },
);

// 组件挂载后初始化编辑器（延迟以适配表格展开行等异步渲染场景）
onMounted(() => {
  isDisposed = false;
  initTimer = setTimeout(() => {
    void initEditor();
  }, 150);
});

// 组件卸载时销毁编辑器
onUnmounted(() => {
  isDisposed = true;
  if (initTimer) {
    clearTimeout(initTimer);
    initTimer = null;
  }
  if (editor.value) {
    editor.value.destroy();
    editor.value = null;
  }
});

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  format,
  validate,
  clear,
  getEditor,
  setReadOnly,
  focus,
  isReady: () => isEditorReady.value,
});
</script>

<template>
  <div
    ref="editorContainer"
    :class="['ace-editor-container', customClass]"
    :style="{
      height: typeof height === 'number' ? `${height}px` : height,
      width: typeof width === 'number' ? `${width}px` : width,
    }"
  ></div>
</template>

<style scoped>
.ace-editor-container {
  position: relative;
  overflow: hidden;
  background: #181818;
  border: 1.5px solid #282c34;
  border-radius: 6px;
}

/* stylelint-disable selector-class-pattern */

/* 深色主题样式 */
.ace-editor-container :deep(.ace_editor) {
  font-family: Monaco, Menlo, 'Ubuntu Mono', Consolas, monospace;
}

.ace-editor-container :deep(.ace_gutter) {
  color: #858585;
  background: #1e1e1e;
}

.ace-editor-container :deep(.ace_scroller) {
  background: #181818;
}

.ace-editor-container :deep(.ace_content) {
  background: #181818;
}
/* stylelint-enable selector-class-pattern */
</style>
